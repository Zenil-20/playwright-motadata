/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * NCCM test-data matrix. Rows reference .env variable NAMES (never literal secrets).
 * IPs are drawn from the three working specs + the Endtest flows:
 *   172.16.12.3  — Cisco, default SNMP, later NCM-managed w/ TFTP cred   [DeviceNccmDiscovery]
 *   172.16.14.8  — SSH (ospf3), NCM, No-Protocol transfer               [DeviceNccmDiscovery]
 *   172.16.14.6  — SSH (ospf1), NCM, TFTP transfer                      [DeviceNccmDiscovery/PerformNccmActions]
 *   172.16.14.7  — SSH, NCM                                             [Endtest testcreatediscoveryprofile14.7ncm]
 *   172.16.10.43 — switch, NCM                                          [Endtest discovery_switch_10.43]
 *   172.16.14.5  — Juniper, NCM                                         [Endtest discovery_juniper_14.5]
 *
 * Column contract (per device row):
 *   key               unique row id
 *   ip_env            .env var holding the device IP (fallback literal in `ip`)
 *   ip                literal IP (non-secret; safe to keep for discovery targets)
 *   vendor            device vendor (informational)
 *   cred_type         'snmp' | 'ssh' | 'ssh-tftp'
 *   user_env          .env var for the login username
 *   pass_env          .env var for the login password
 *   enable_env        .env var for the enable password (SSH), or null
 *   enable_prompt     the enable-mode prompt char (non-secret, e.g. '#')
 *   transfer_protocol 'TFTP' | 'No Protocol' | null
 *   ncm               true when Network Config Management is enabled at discovery
 */

// ── NCM device matrix ───────────────────────────────────────────────────────
export const NCM_DEVICES = [
  {
    key: 'cisco_12_3',
    ip_env: 'NCCM_IP_12_3',
    ip: '172.16.12.3',
    vendor: 'cisco',
    cred_type: 'snmp',            // discovered with default SNMP; NCM cred (TFTP) added from inventory
    user_env: 'NCCM_12_3_USER',   // spec used literal 'cisco'
    pass_env: 'NCCM_12_3_PASS',   // spec used literal 'cisco'
    enable_env: 'NCCM_12_3_ENABLE',
    enable_prompt: '#',
    transfer_protocol: 'TFTP',
    ncm: true,
  },
  {
    key: 'ospf3_14_8',
    ip_env: 'NCCM_IP_14_8',
    ip: '172.16.14.8',
    vendor: 'cisco',
    cred_type: 'ssh',
    user_env: 'NCCM_14_8_USER',   // spec used literal 'ospf3'
    pass_env: 'NCCM_14_8_PASS',   // spec used literal 'ospf3'
    enable_env: 'NCCM_14_8_ENABLE',
    enable_prompt: '#',
    transfer_protocol: 'No Protocol',
    ncm: true,
  },
  {
    key: 'ospf1_14_6',
    ip_env: 'NCCM_IP_14_6',
    ip: '172.16.14.6',
    vendor: 'cisco',
    cred_type: 'ssh-tftp',
    user_env: 'NCCM_14_6_USER',   // spec used literal 'ospf1'
    pass_env: 'NCCM_14_6_PASS',   // spec used literal 'ospf1'
    enable_env: 'NCCM_14_6_ENABLE',
    enable_prompt: '#',
    transfer_protocol: 'TFTP',
    ncm: true,
  },
  {
    key: 'cisco_14_7',
    ip_env: 'NCCM_IP_14_7',
    ip: '172.16.14.7',
    vendor: 'cisco',
    cred_type: 'ssh',
    user_env: 'NCCM_14_7_USER',
    pass_env: 'NCCM_14_7_PASS',
    enable_env: 'NCCM_14_7_ENABLE',
    enable_prompt: '#',
    transfer_protocol: 'TFTP',
    ncm: true,
  },
  {
    key: 'switch_10_43',
    ip_env: 'NCCM_IP_10_43',
    ip: '172.16.10.43',
    vendor: 'cisco-switch',
    cred_type: 'ssh',
    user_env: 'NCCM_10_43_USER',
    pass_env: 'NCCM_10_43_PASS',
    enable_env: 'NCCM_10_43_ENABLE',
    enable_prompt: '#',
    transfer_protocol: 'TFTP',
    ncm: true,
  },
  {
    key: 'juniper_14_5',
    ip_env: 'NCCM_IP_14_5',
    ip: '172.16.14.5',
    vendor: 'juniper',
    cred_type: 'ssh',
    user_env: 'NCCM_14_5_USER',
    pass_env: 'NCCM_14_5_PASS',
    enable_env: 'NCCM_14_5_ENABLE',
    enable_prompt: '#',
    transfer_protocol: null,
    ncm: true,
  },
];

// ── Storage-profile matrix (Settings > Storage Profile) ─────────────────────
// From Endtest "TFTP storage profile for NCM" / "SCP storage profile" / "FTP storage profile".
// host/user/pass reference .env var NAMES; the TFTP host + port are non-secret transport params.
export const STORAGE_PROFILES = [
  {
    key: 'tftp',
    name: 'TFTP',
    protocol: 'TFTP',
    host_env: 'NCCM_TFTP_HOST',
    host: '172.16.15.208',
    port: '69',
    user_env: null,           // TFTP has no auth
    pass_env: null,
  },
  {
    key: 'scp',
    name: 'SCP',
    protocol: 'SCP',
    host_env: 'NCCM_SCP_HOST',
    host: null,               // TODO(seed): fill SCP host in .env
    port: '22',
    user_env: 'NCCM_SCP_USER',
    pass_env: 'NCCM_SCP_PASS',
  },
  {
    key: 'ftp',
    name: 'FTP',
    protocol: 'FTP',
    host_env: 'NCCM_FTP_HOST',
    host: null,               // TODO(seed): fill FTP host in .env
    port: '21',
    user_env: 'NCCM_FTP_USER',
    pass_env: 'NCCM_FTP_PASS',
  },
];

/** Resolve a row's env-referenced fields to live values (used at runtime, not import). */
export function resolveDevice(row, env = process.env) {
  return {
    ...row,
    ip: env[row.ip_env] || row.ip,
    user: row.user_env ? env[row.user_env] : undefined,
    pass: row.pass_env ? env[row.pass_env] : undefined,
    enablePass: row.enable_env ? env[row.enable_env] : undefined,
    enablePrompt: row.enable_prompt,
    transferProtocol: row.transfer_protocol,
  };
}

export function resolveStorageProfile(row, env = process.env) {
  return {
    ...row,
    host: (row.host_env && env[row.host_env]) || row.host,
    user: row.user_env ? env[row.user_env] : undefined,
    pass: row.pass_env ? env[row.pass_env] : undefined,
  };
}

export default { NCM_DEVICES, STORAGE_PROFILES, resolveDevice, resolveStorageProfile };
