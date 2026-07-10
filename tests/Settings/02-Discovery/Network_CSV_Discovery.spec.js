/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * This software and associated documentation are the confidential and
 * proprietary information of Motadata.
 *
 * Unauthorized use, reproduction, disclosure, or distribution of this
 * material is strictly prohibited.
 *
 * You shall use this software only in accordance with the terms of the
 * license agreement entered into with Motadata.
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

// The provision-status popup renders as a role=document popover (NOT role=dialog), so a
// dialog-scoped match is unreliable and a bare svg[data-icon="times"] click can hit a
// page-header icon instead (strict-mode violation / wrong element). Target the cross <a>
// inside the flex header that holds the "Provision Status" heading.
async function closeProvisionStatus(page) {
  const header = page.locator('.flex.justify-between')
    .filter({ has: page.getByRole('heading', { name: 'Provision Status' }) });
  await expect(header).toBeVisible({ timeout: 30000 });
  await header.locator('a:has(svg[data-icon="times"])').click();
}

const APP_URL = process.env.Motadata_Aiops;
const APP_USERNAME = process.env.Motadata_Username;
const APP_PASSWORD = process.env.Motadata_Password;

const INPUT_FILE_PATH =
  process.env.Network_CSV_Discovery_File ||
  process.env.Network_CSV_File_Path ||
  process.env.NETWORK_CSV_FILE_PATH;

const COLLECTOR_NAME =
  process.env.Network_CSV_Collector ||
  process.env.NETWORK_CSV_COLLECTOR;

const CREDENTIAL_PROFILE_NAME =
  process.env.Network_CSV_Credential_Profile ||
  process.env.NETWORK_CSV_CREDENTIAL_PROFILE ||
  'Default SNMP';

const CSV_ROW_LIMIT = Number.parseInt(
  process.env.Network_CSV_Row_Limit ||
    process.env.NETWORK_CSV_ROW_LIMIT ||
    '150',
  10
);

const PROFILE_TIMEZONE =
  process.env.Network_CSV_Profile_Timezone ||
  process.env.NETWORK_CSV_PROFILE_TIMEZONE ||
  'Asia/Kolkata';

const PROFILE_PREFIX =
  process.env.Network_CSV_Profile_Name ||
  process.env.NETWORK_CSV_PROFILE_NAME ||
  '';

const DEFAULT_UI_TIMEOUT = 30000;
const LONG_UI_TIMEOUT = 480000;
const MAX_SAFE_CSV_ROW_LIMIT = 10000;

function validateEnv() {
  const missing = [];

  if (!APP_URL) missing.push('Motadata_Aiops');
  if (!APP_USERNAME) missing.push('Motadata_Username');
  if (!APP_PASSWORD) missing.push('Motadata_Password');
  if (!INPUT_FILE_PATH) {
    missing.push(
      'Network_CSV_Discovery_File or Network_CSV_File_Path or NETWORK_CSV_FILE_PATH'
    );
  }

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  if (!Number.isInteger(CSV_ROW_LIMIT) || CSV_ROW_LIMIT <= 0) {
    throw new Error('CSV row limit must be a positive integer.');
  }

  if (CSV_ROW_LIMIT > MAX_SAFE_CSV_ROW_LIMIT) {
    throw new Error(
      `CSV row limit must not exceed ${MAX_SAFE_CSV_ROW_LIMIT}.`
    );
  }

  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: PROFILE_TIMEZONE }).format(
      new Date()
    );
  } catch (error) {
    throw new Error(`Invalid profile timezone: ${PROFILE_TIMEZONE}`);
  }
}

function resolveInputFilePath(filePath) {
  if (!filePath) {
    throw new Error('Input file path is empty.');
  }

  const resolvedPath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Input file not found: ${resolvedPath}`);
  }

  return resolvedPath;
}

function formatDiscoveryProfileName() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: PROFILE_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(now).map(({ type, value }) => [type, value])
  );
  const baseName = `${parts.hour}:${parts.minute}_${parts.day}-${parts.month}-${parts.year}`;

  return PROFILE_PREFIX ? `${baseName}_${PROFILE_PREFIX}` : baseName;
}

function columnReferenceToIndex(reference = '') {
  let index = 0;
  const letters = String(reference).replace(/[^A-Z]/gi, '').toUpperCase();

  for (const character of letters) {
    index = index * 26 + character.charCodeAt(0) - 64;
  }

  return Math.max(index - 1, 0);
}

function escapeCsvValue(value = '') {
  const safeValue = String(value ?? '');
  const protectedValue =
    /^[=+\-@]/.test(safeValue) ? `'${safeValue}` : safeValue;

  return `"${protectedValue.replace(/"/g, '""')}"`;
}

function xpathLiteral(value) {
  if (!String(value).includes("'")) {
    return `'${value}'`;
  }

  if (!String(value).includes('"')) {
    return `"${value}"`;
  }

  const parts = String(value).split("'");
  return `concat(${parts
    .map((part, index) =>
      index === parts.length - 1
        ? `'${part}'`
        : `'${part}',"'",`
    )
    .join('')})`;
}

function resolveRelationshipTarget(basePartPath, targetPath) {
  const normalizedTarget = String(targetPath || '').replace(/^\/+/, '');

  if (!normalizedTarget) {
    throw new Error(`Relationship target is empty for ${basePartPath}.`);
  }

  if (normalizedTarget.startsWith('xl/')) {
    return path.posix.normalize(normalizedTarget);
  }

  return path.posix.normalize(
    path.posix.join(path.posix.dirname(basePartPath), normalizedTarget)
  );
}

function readZipEntries(zipBuffer) {
  if (!Buffer.isBuffer(zipBuffer) || zipBuffer.length < 22) {
    throw new Error('Invalid XLSX file: zip buffer is empty or too small.');
  }

  const eocdSignature = 0x06054b50;
  const centralDirectorySignature = 0x02014b50;
  const localFileHeaderSignature = 0x04034b50;
  let eocdOffset = -1;

  for (let offset = zipBuffer.length - 22; offset >= 0; offset -= 1) {
    if (zipBuffer.readUInt32LE(offset) === eocdSignature) {
      eocdOffset = offset;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error('Invalid XLSX file: end of central directory not found.');
  }

  const centralDirectorySize = zipBuffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = zipBuffer.readUInt32LE(eocdOffset + 16);

  if (
    centralDirectoryOffset < 0 ||
    centralDirectorySize < 0 ||
    centralDirectoryOffset + centralDirectorySize > zipBuffer.length
  ) {
    throw new Error('Invalid XLSX file: central directory is out of bounds.');
  }

  const entries = new Map();
  let cursor = centralDirectoryOffset;
  const end = centralDirectoryOffset + centralDirectorySize;

  while (cursor < end) {
    if (zipBuffer.readUInt32LE(cursor) !== centralDirectorySignature) {
      throw new Error('Invalid XLSX file: central directory entry not found.');
    }

    const compressionMethod = zipBuffer.readUInt16LE(cursor + 10);
    const compressedSize = zipBuffer.readUInt32LE(cursor + 20);
    const fileNameLength = zipBuffer.readUInt16LE(cursor + 28);
    const extraFieldLength = zipBuffer.readUInt16LE(cursor + 30);
    const fileCommentLength = zipBuffer.readUInt16LE(cursor + 32);
    const localHeaderOffset = zipBuffer.readUInt32LE(cursor + 42);

    if (cursor + 46 + fileNameLength + extraFieldLength + fileCommentLength > zipBuffer.length) {
      throw new Error('Invalid XLSX file: central directory entry exceeds buffer bounds.');
    }

    const fileName = zipBuffer
      .slice(cursor + 46, cursor + 46 + fileNameLength)
      .toString('utf8');

    if (localHeaderOffset < 0 || localHeaderOffset + 30 > zipBuffer.length) {
      throw new Error(`Invalid XLSX file: local header offset out of bounds for ${fileName}.`);
    }

    if (zipBuffer.readUInt32LE(localHeaderOffset) !== localFileHeaderSignature) {
      throw new Error(`Invalid XLSX file: local header missing for ${fileName}.`);
    }

    const localFileNameLength = zipBuffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraFieldLength = zipBuffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart =
      localHeaderOffset + 30 + localFileNameLength + localExtraFieldLength;

    if (dataStart < 0 || dataStart + compressedSize > zipBuffer.length) {
      throw new Error(`Invalid XLSX file: compressed data exceeds bounds for ${fileName}.`);
    }

    const compressedData = zipBuffer.slice(dataStart, dataStart + compressedSize);
    let content;

    if (compressionMethod === 0) {
      content = compressedData;
    } else if (compressionMethod === 8) {
      content = zlib.inflateRawSync(compressedData);
    } else {
      throw new Error(
        `Unsupported XLSX compression method ${compressionMethod} for ${fileName}.`
      );
    }

    entries.set(fileName, content);
    cursor += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }

  return entries;
}

function getEntryText(entries, entryName) {
  return entries.get(entryName)?.toString('utf8') || '';
}

async function resolveWorksheetPath(page, workbookXml, workbookRelsXml) {
  const worksheetTarget = await page.evaluate(
    ({ workbookXmlText, workbookRelsXmlText }) => {
      function parseXml(xmlText, label) {
        const documentNode = new DOMParser().parseFromString(xmlText, 'application/xml');
        const parserError = documentNode.getElementsByTagName('parsererror')[0];

        if (parserError) {
          throw new Error(`Invalid ${label} XML.`);
        }

        return documentNode;
      }

      function byLocalName(rootNode, localName) {
        return Array.from(rootNode.getElementsByTagName('*')).filter(
          (node) => node.localName === localName
        );
      }

      const workbookDocument = parseXml(workbookXmlText, 'workbook');
      const relationshipsDocument = parseXml(
        workbookRelsXmlText,
        'workbook relationships'
      );

      const sheets = byLocalName(workbookDocument, 'sheet');
      if (!sheets.length) {
        throw new Error('Workbook does not contain any sheets.');
      }

      const workbookView = byLocalName(workbookDocument, 'workbookView')[0];
      const activeSheetIndex = Number.parseInt(
        workbookView?.getAttribute('activeTab') || '0',
        10
      );
      const selectedSheet = sheets[activeSheetIndex] || sheets[0];
      const relationshipId =
        selectedSheet.getAttribute('r:id') ||
        selectedSheet.getAttributeNS(
          'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
          'id'
        );

      if (!relationshipId) {
        throw new Error('Workbook sheet relationship id not found.');
      }

      const relationship = byLocalName(relationshipsDocument, 'Relationship').find(
        (node) => node.getAttribute('Id') === relationshipId
      );

      if (!relationship) {
        throw new Error(`Workbook relationship ${relationshipId} not found.`);
      }

      return relationship.getAttribute('Target') || '';
    },
    {
      workbookXmlText: workbookXml,
      workbookRelsXmlText: workbookRelsXml,
    }
  );

  const target = worksheetTarget.replace(/^\/+/, '');
  return resolveRelationshipTarget('xl/workbook.xml', target);
}

async function readWorksheetRows(page, worksheetXml, sharedStringsXml, stylesXml, rowLimit) {
  return page.evaluate(
    ({ worksheetXmlText, sharedStringsXmlText, stylesXmlText, limit }) => {
      function parseXml(xmlText, label) {
        const documentNode = new DOMParser().parseFromString(xmlText, 'application/xml');
        const parserError = documentNode.getElementsByTagName('parsererror')[0];

        if (parserError) {
          throw new Error(`Invalid ${label} XML.`);
        }

        return documentNode;
      }

      function byLocalName(rootNode, localName) {
        return Array.from(rootNode.getElementsByTagName('*')).filter(
          (node) => node.localName === localName
        );
      }

      function directChildrenByLocalName(rootNode, localName) {
        return Array.from(rootNode.children).filter(
          (node) => node.localName === localName
        );
      }

      function text(node) {
        return node?.textContent || '';
      }

      function columnIndex(reference) {
        let index = 0;
        const letters = String(reference).replace(/[^A-Z]/gi, '').toUpperCase();

        for (const character of letters) {
          index = index * 26 + character.charCodeAt(0) - 64;
        }

        return Math.max(index - 1, 0);
      }

      function excelSerialDateToIsoLocal(serialValue) {
        const serial = Number(serialValue);
        if (!Number.isFinite(serial)) {
          return String(serialValue);
        }

        const excelEpoch = Date.UTC(1899, 11, 30);
        const milliseconds = Math.round(serial * 24 * 60 * 60 * 1000);
        const date = new Date(excelEpoch + milliseconds);

        if (Number.isNaN(date.getTime())) {
          return String(serialValue);
        }

        return date.toISOString();
      }

      const worksheetDocument = parseXml(worksheetXmlText, 'worksheet');
      const sharedStringsDocument = sharedStringsXmlText
        ? parseXml(sharedStringsXmlText, 'shared strings')
        : null;
      const stylesDocument = stylesXmlText
        ? parseXml(stylesXmlText, 'styles')
        : null;

      const sharedStrings = sharedStringsDocument
        ? byLocalName(sharedStringsDocument, 'si').map((node) => text(node))
        : [];

      const styleMap = new Map();
      if (stylesDocument) {
        const styleNodes = byLocalName(stylesDocument, 'cellXfs')[0];
        if (styleNodes) {
          directChildrenByLocalName(styleNodes, 'xf').forEach((node, index) => {
            const numFmtId = Number.parseInt(node.getAttribute('numFmtId') || '', 10);
            if (Number.isInteger(numFmtId)) {
              styleMap.set(index, numFmtId);
            }
          });
        }
      }

      const dateLikeFormats = new Set([
        14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 30, 36, 45, 46, 47, 50, 57,
      ]);

      const rows = byLocalName(worksheetDocument, 'row');
      const parsedRows = [];

      for (const rowNode of rows) {
        if (parsedRows.length >= limit + 1) {
          break;
        }

        const rowValues = [];
        const cells = directChildrenByLocalName(rowNode, 'c');

        for (const cellNode of cells) {
          const reference = cellNode.getAttribute('r') || 'A1';
          const type = cellNode.getAttribute('t') || '';
          const styleId = Number.parseInt(cellNode.getAttribute('s') || '', 10);
          const column = columnIndex(reference);

          while (rowValues.length <= column) {
            rowValues.push('');
          }

          let value = '';

          if (type === 's') {
            const valueNode = directChildrenByLocalName(cellNode, 'v')[0];
            const sharedIndex = Number.parseInt(text(valueNode) || '', 10);

            if (
              !Number.isInteger(sharedIndex) ||
              sharedIndex < 0 ||
              sharedIndex >= sharedStrings.length
            ) {
              throw new Error(`Invalid shared string index: ${sharedIndex}`);
            }

            value = sharedStrings[sharedIndex];
          } else if (type === 'inlineStr') {
            const inlineNode = directChildrenByLocalName(cellNode, 'is')[0];
            value = text(inlineNode);
          } else if (type === 'b') {
            const valueNode = directChildrenByLocalName(cellNode, 'v')[0];
            value = text(valueNode) === '1' ? 'TRUE' : 'FALSE';
          } else {
            const valueNode = directChildrenByLocalName(cellNode, 'v')[0];
            value = text(valueNode);

            if (
              value !== '' &&
              Number.isInteger(styleId) &&
              styleMap.has(styleId) &&
              dateLikeFormats.has(styleMap.get(styleId)) &&
              !Number.isNaN(Number(value))
            ) {
              value = excelSerialDateToIsoLocal(value);
            }
          }

          rowValues[column] = value;
        }

        parsedRows.push(rowValues);
      }

      return parsedRows;
    },
    {
      worksheetXmlText: worksheetXml,
      sharedStringsXmlText: sharedStringsXml,
      stylesXmlText: stylesXml,
      limit: rowLimit,
    }
  );
}

async function convertWorkbookToCsvIfNeeded(page, filePath) {
  if (path.extname(filePath).toLowerCase() !== '.xlsx') {
    return { preparedPath: filePath, generated: false };
  }

  const workbookBuffer = fs.readFileSync(filePath);
  const entries = readZipEntries(workbookBuffer);
  const workbookXml = getEntryText(entries, 'xl/workbook.xml');
  const workbookRelsXml = getEntryText(entries, 'xl/_rels/workbook.xml.rels');
  const sharedStringsXml = getEntryText(entries, 'xl/sharedStrings.xml');
  const stylesXml = getEntryText(entries, 'xl/styles.xml');

  if (!workbookXml) {
    throw new Error(`workbook.xml not found in workbook: ${filePath}`);
  }

  if (!workbookRelsXml) {
    throw new Error(`workbook.xml.rels not found in workbook: ${filePath}`);
  }

  const worksheetPath = await resolveWorksheetPath(page, workbookXml, workbookRelsXml);
  const worksheetXml = getEntryText(entries, worksheetPath);

  if (!worksheetXml) {
    throw new Error(`Worksheet XML not found in workbook: ${worksheetPath}`);
  }

  const rows = await readWorksheetRows(
    page,
    worksheetXml,
    sharedStringsXml,
    stylesXml,
    CSV_ROW_LIMIT
  );

  if (!rows.length) {
    throw new Error(`No worksheet rows were parsed from workbook: ${filePath}`);
  }

  if (!rows[0]?.some((cell) => String(cell ?? '').trim())) {
    throw new Error(`Workbook header row is empty: ${filePath}`);
  }

  const outputDir = path.resolve('test-results', 'generated-inputs');
  fs.mkdirSync(outputDir, { recursive: true });

  const outputName = `${path.basename(filePath, path.extname(filePath))}-${Date.now()}.csv`;
  const preparedPath = path.join(outputDir, outputName);
  const csvContent = rows
    .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
    .join('\n');

  if (!csvContent.trim()) {
    throw new Error(`Prepared CSV content is empty for workbook: ${filePath}`);
  }

  fs.writeFileSync(preparedPath, csvContent, 'utf8');

  return { preparedPath, generated: true };
}

async function captureDomSnapshot(page, fileName) {
  if (!page || page.isClosed()) {
    return '';
  }

  const snapshotDir = path.resolve('test-results', 'dom-snapshots');
  fs.mkdirSync(snapshotDir, { recursive: true });

  const snapshotPath = path.join(snapshotDir, fileName);
  fs.writeFileSync(snapshotPath, await page.content(), 'utf8');

  return snapshotPath;
}

async function safeClick(locator, timeout = DEFAULT_UI_TIMEOUT) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  await expect(locator).toBeVisible({ timeout });
  await expect(locator).toBeEnabled({ timeout });
  await locator.click();
}

async function checkCheckbox(locator, timeout = DEFAULT_UI_TIMEOUT) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  await expect(locator).toBeVisible({ timeout });

  if (!(await locator.isChecked().catch(() => false))) {
    await locator.check({ force: true }).catch(async () => {
      await locator.click({ force: true });
    });
  }

  if (!(await locator.isChecked().catch(() => false))) {
    await locator.evaluate((node) => {
      node.click();
      node.parentElement?.click();
    });
  }

  await expect(locator).toBeChecked({ timeout });
}

async function selectFirstDiscoveredResult(page) {
  const directCheckbox = page.locator("table tr input[type='checkbox']").first();
  if (await directCheckbox.isVisible({ timeout: DEFAULT_UI_TIMEOUT }).catch(() => false)) {
    await checkCheckbox(directCheckbox);
    return;
  }

  const antCheckbox = page.locator('table tr .ant-checkbox-input').first();
  if (await antCheckbox.isVisible({ timeout: DEFAULT_UI_TIMEOUT }).catch(() => false)) {
    await checkCheckbox(antCheckbox);
    return;
  }

  const checkboxWrapper = page.locator('table tr .ant-checkbox-wrapper').first();
  if (await checkboxWrapper.isVisible({ timeout: DEFAULT_UI_TIMEOUT }).catch(() => false)) {
    await checkboxWrapper.click({ force: true });
    return;
  }

  throw new Error('No selectable discovered result checkbox was found.');
}

async function assertNoVisibleErrorState(page, timeout = DEFAULT_UI_TIMEOUT) {
  const blockingError = page
    .locator(
      "//*[contains(normalize-space(),'Unsupported file type') or contains(normalize-space(),'Only csv are allowed') or contains(normalize-space(),'Failed to start the discovery') or contains(normalize-space(),'already provisioned')]"
    )
    .first();

  const isVisible = await blockingError.isVisible({ timeout }).catch(() => false);
  if (isVisible) {
    const message = (await blockingError.textContent().catch(() => 'Unknown UI error'))
      ?.replace(/\s+/g, ' ')
      .trim();
    throw new Error(message || 'Unknown UI error');
  }
}

async function assertDiscoveryResultSummary(page) {
  const discoveredObjectsSummary = page
    .locator("//*[contains(normalize-space(),'Discovered Objects')]")
    .first();
  const failedObjectsSummary = page
    .locator("//*[contains(normalize-space(),'Failed Objects')]")
    .first();

  await expect(discoveredObjectsSummary).toBeVisible({
    timeout: DEFAULT_UI_TIMEOUT,
  });
  await expect(failedObjectsSummary).toBeVisible({
    timeout: DEFAULT_UI_TIMEOUT,
  });

  await expect(
    page.locator(
      "//*[contains(normalize-space(),'Discovered Objects')]/following-sibling::*[1][normalize-space()!='']"
    ).first()
  ).toContainText(/\d+/, { timeout: DEFAULT_UI_TIMEOUT });
  await expect(
    page.locator(
      "//*[contains(normalize-space(),'Failed Objects')]/following-sibling::*[1][normalize-space()!='']"
    ).first()
  ).toContainText(/\d+/, { timeout: DEFAULT_UI_TIMEOUT });
}

async function waitForProvisionSuccess(page) {
  const provisionDialog = page.getByRole('dialog', {
    name: /provision status/i,
  });
  const successMessage = page.getByText(/provisioned successfully/i).first();

  await Promise.race([
    provisionDialog.waitFor({ state: 'visible', timeout: LONG_UI_TIMEOUT }).catch(() => null),
    successMessage.waitFor({ state: 'visible', timeout: LONG_UI_TIMEOUT }).catch(() => null),
  ]);

  await expect(successMessage).toBeVisible({ timeout: LONG_UI_TIMEOUT });

  await closeProvisionStatus(page);
}

async function selectDropdownOption(page, inputLocator, optionText) {
  await safeClick(inputLocator);

  const dropdownSearch = page.locator("//input[@data-cy='dropdown-search-input']").last();
  if (await dropdownSearch.isVisible().catch(() => false)) {
    await dropdownSearch.fill(optionText);
  }

  const option = page
    .locator(
      `//span[@title=${xpathLiteral(optionText)}] | //div[@role='option' and normalize-space()=${xpathLiteral(optionText)}] | //li[@role='option' and normalize-space()=${xpathLiteral(optionText)}] | //li[@role='menuitem' and normalize-space()=${xpathLiteral(optionText)}]`
    )
    .first();

  await expect(option).toBeVisible({ timeout: DEFAULT_UI_TIMEOUT });
  await option.click();
}

async function selectFirstDropdownOption(page, inputLocator) {
  await safeClick(inputLocator);

  const dropdownContainer = page.locator(
    "//div[@role='option' and not(@aria-disabled='true')] | //li[@role='option' and not(@aria-disabled='true')] | //li[@role='menuitem' and not(@aria-disabled='true')] | //span[@title]"
  );
  const firstOption = dropdownContainer.filter({ hasNotText: 'No Data' }).first();

  await expect(firstOption).toBeVisible({ timeout: DEFAULT_UI_TIMEOUT });
  await firstOption.click();
}

async function waitForDiscoveryProfilePage(page) {
  const discoveryProfileLink = page.locator(
    "//a[@href='/settings/network-discovery/network-discovery-profiles' and normalize-space()='Discovery Profile']"
  );

  await expect(discoveryProfileLink).toBeVisible({ timeout: DEFAULT_UI_TIMEOUT });
  await discoveryProfileLink.click({ force: true }).catch(() => {});

  const onDiscoveryProfilePage = await page
    .waitForURL(/\/settings\/network-discovery\/network-discovery-profiles(\/|$)/, {
      timeout: 5000,
    })
    .then(() => true)
    .catch(() => false);

  if (!onDiscoveryProfilePage) {
    await page.goto(`${APP_URL}/settings/network-discovery/network-discovery-profiles`, {
      waitUntil: 'networkidle',
      timeout: LONG_UI_TIMEOUT,
    });
  }

  await page.waitForLoadState('networkidle').catch(() => {});
  await expect(
    page.getByRole('button', { name: 'Create Discovery Profile' })
  ).toBeVisible({ timeout: LONG_UI_TIMEOUT });
}

async function enableToggle(page, labelText) {
  const roleSwitch = page
    .locator(`//*[normalize-space()=${xpathLiteral(labelText)}]/following::*[@role='switch'][1]`)
    .first();

  if (await roleSwitch.isVisible().catch(() => false)) {
    if ((await roleSwitch.getAttribute('aria-checked')) !== 'true') {
      await roleSwitch.click();
    }
    await expect(roleSwitch).toHaveAttribute('aria-checked', 'true');
    return;
  }

  const checkboxSwitch = page
    .locator(`//*[normalize-space()=${xpathLiteral(labelText)}]/following::input[@type='checkbox'][1]`)
    .first();

  if (await checkboxSwitch.isVisible().catch(() => false)) {
    if (!(await checkboxSwitch.isChecked())) {
      await checkboxSwitch.check({ force: true });
    }
    await expect(checkboxSwitch).toBeChecked();
    return;
  }

  const offToggle = page
    .locator(`//*[normalize-space()=${xpathLiteral(labelText)}]/following::*[normalize-space()='OFF'][1]`)
    .first();

  await expect(offToggle).toBeVisible({ timeout: DEFAULT_UI_TIMEOUT });
  await offToggle.click();
  await expect(
    page
      .locator(`//*[normalize-space()=${xpathLiteral(labelText)}]/following::*[normalize-space()='ON'][1]`)
      .first()
  ).toBeVisible({ timeout: DEFAULT_UI_TIMEOUT });
}

async function loginToMotadata(page) {
  await page.goto(APP_URL, {
    timeout: LONG_UI_TIMEOUT,
    waitUntil: 'domcontentloaded',
  });

  await page.getByRole('textbox', { name: /username/i }).fill(APP_USERNAME);
  await page.getByRole('textbox', { name: /password/i }).fill(APP_PASSWORD);
  await page.getByRole('button', { name: /login/i }).click();

  const loginFailureMessage = page.getByText(/login failed|invalid credentials/i);
  const settingsLink = page.locator("//a[@href='/settings/']");
  const postLoginAnchor = page.locator(
    "//a[@href='/dashboard'] | //a[@href='/dashboard/'] | //a[@href='/settings/']"
  );

  await Promise.race([
    page
      .waitForURL(/\/(dashboard|monitors|settings)(\/|$)/, {
        timeout: DEFAULT_UI_TIMEOUT,
      })
      .catch(() => null),
    settingsLink.waitFor({ state: 'visible', timeout: DEFAULT_UI_TIMEOUT }).catch(() => null),
    postLoginAnchor
      .waitFor({ state: 'visible', timeout: DEFAULT_UI_TIMEOUT })
      .catch(() => null),
    loginFailureMessage
      .waitFor({ state: 'visible', timeout: DEFAULT_UI_TIMEOUT })
      .catch(() => null),
  ]);

  await expect(loginFailureMessage).toHaveCount(0);
  await expect(settingsLink.or(postLoginAnchor).first()).toBeVisible({
    timeout: DEFAULT_UI_TIMEOUT,
  });
  await page.waitForLoadState('networkidle').catch(() => {});
}

test.describe.serial('Motadata AIOps Discovery Flow For Network CSV Discovery', () => {
  let context;
  let page;
  let csvFilePath;
  let generatedCsvPath = '';
  let profileName;

  test.beforeAll(async ({ browser }) => {
    validateEnv();

    context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(DEFAULT_UI_TIMEOUT);

    const inputPath = resolveInputFilePath(INPUT_FILE_PATH);
    const preparedInput = await convertWorkbookToCsvIfNeeded(page, inputPath);

    csvFilePath = preparedInput.preparedPath;
    generatedCsvPath = preparedInput.generated ? preparedInput.preparedPath : '';

    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`Prepared CSV file not found: ${csvFilePath}`);
    }

    profileName = formatDiscoveryProfileName();
  });

  test.afterAll(async () => {
    if (page && !page.isClosed()) {
      await page.close();
    }

    if (context) {
      await context.close();
    }

    if (generatedCsvPath && fs.existsSync(generatedCsvPath)) {
      fs.unlinkSync(generatedCsvPath);
    }
  });

  test('Login to Motadata AIOps', async () => {
    await login(page);
  });

  test('Navigate to Discovery Profile and open creation drawer', async () => {
    await safeClick(page.locator("//a[@href='/settings/']").first());
    const phoneNumberInput = page.locator("//input[@id='phone-number']").first();
    if (await phoneNumberInput.isVisible().catch(() => false)) {
      await phoneNumberInput.click();
    }

    const searchBox = page.locator("//input[@placeholder='Search']").first();
    await expect(searchBox).toBeVisible({ timeout: DEFAULT_UI_TIMEOUT });
    await searchBox.fill('discovery profile');

    await waitForDiscoveryProfilePage(page);
    await safeClick(page.getByRole('button', { name: 'Create Discovery Profile' }));
    await safeClick(page.getByText('Network', { exact: true }));

    await expect(page.getByText('Create Discovery Profile')).toBeVisible({
      timeout: DEFAULT_UI_TIMEOUT,
    });
  });

  test('Create CSV based discovery in Network category with Run Topology enabled', async () => {
    try {
      await safeClick(page.getByText('CSV', { exact: true }).first());

      const profileNameInput = page.locator('input[name="profile-name"]').first();
      await expect(profileNameInput).toBeVisible({ timeout: DEFAULT_UI_TIMEOUT });
      await profileNameInput.fill(profileName);

      const fileInput = page.locator('input[type="file"]').first();
      await expect(fileInput).toBeAttached({ timeout: DEFAULT_UI_TIMEOUT });
      await fileInput.setInputFiles(csvFilePath);
      await safeClick(page.getByRole('button', { name: 'Upload CSV' }));
      await assertNoVisibleErrorState(page);

      if (COLLECTOR_NAME) {
        const collectorsInput = page
          .locator("//*[normalize-space()='Collectors']/following::input[@placeholder='Select'][1]")
          .first();

        if (await collectorsInput.isVisible().catch(() => false)) {
          await selectDropdownOption(page, collectorsInput, COLLECTOR_NAME);
        }
      }

      const credentialPicker = page.locator('#credential-profile-picker-id');
      await expect(credentialPicker).toBeVisible({ timeout: DEFAULT_UI_TIMEOUT });
      await credentialPicker.click();

      const searchInput = page
        .locator("//input[@data-cy='dropdown-search-input']")
        .last();
      await expect(searchInput).toBeVisible({ timeout: DEFAULT_UI_TIMEOUT });
      await searchInput.fill(CREDENTIAL_PROFILE_NAME);

      const credentialOption = page
        .locator(
          `//span[@title=${xpathLiteral(CREDENTIAL_PROFILE_NAME)}] | //div[@role='option' and normalize-space()=${xpathLiteral(CREDENTIAL_PROFILE_NAME)}] | //li[@role='option' and normalize-space()=${xpathLiteral(CREDENTIAL_PROFILE_NAME)}]`
        )
        .first();

      await expect(credentialOption).toBeVisible({ timeout: DEFAULT_UI_TIMEOUT });
      await credentialOption.click();

      await enableToggle(page, 'Run Topology');

      const entryPointInput = page
        .locator("//*[normalize-space()='Entry Point']/following::input[@placeholder='Select'][1]")
        .first();

      if (await entryPointInput.isVisible().catch(() => false)) {
        const entryPointValue = await entryPointInput.inputValue().catch(() => '');
        if (!entryPointValue.trim()) {
          await selectFirstDropdownOption(page, entryPointInput);
        }
      }

      await safeClick(page.getByRole('button', { name: 'Save and Run' }));
      await assertNoVisibleErrorState(page, 5000);

      await page.waitForURL(
        /\/settings\/network-discovery\/network-discovery-profiles\/\d+\/result/,
        { timeout: LONG_UI_TIMEOUT }
      );
      await expect(
        page.getByRole('heading', { name: profileName }).first()
      ).toBeVisible({ timeout: LONG_UI_TIMEOUT });

      await assertDiscoveryResultSummary(page);
      await captureDomSnapshot(
        page,
        `network-csv-discovery-before-selection-${Date.now()}.html`
      );

      const discoveredRows = page.locator('table tbody tr');
      await expect(discoveredRows.first()).toBeVisible({ timeout: LONG_UI_TIMEOUT });

      await selectFirstDiscoveredResult(page);
      await page.waitForTimeout(1000);

      const addSelectedButton = page
        .locator('#add-selected-btn-id')
        .or(
          page.getByRole('button', {
            name: /add selected|add selected objects/i,
          })
        )
        .first();
      await expect(addSelectedButton).toBeVisible({ timeout: DEFAULT_UI_TIMEOUT });
      await expect(addSelectedButton).toBeEnabled({ timeout: DEFAULT_UI_TIMEOUT });
      await captureDomSnapshot(
        page,
        `network-csv-discovery-before-provision-${Date.now()}.html`
      );
      await addSelectedButton.click();

      await waitForProvisionSuccess(page);
    } catch (error) {
      await captureDomSnapshot(
        page,
        `network-csv-discovery-failure-${Date.now()}.html`
      );
      throw error;
    }
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
