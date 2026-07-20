/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Test data for the REST API + URL Service-Check discovery specs.
 *
 * All rows point at the lightweight test API deployed on 172.16.15.160:
 *   REST API server  ->  http  :18080   https/mTLS :18443
 *   URL server       ->  http  :9090    https/mTLS :9443
 *
 * Override any of these via env (e.g. SC_REST_HTTP) without touching the spec.
 * Credentials mirror the test-server defaults (admin / motadata, etc.).
 */

const HOST = process.env.SC_TARGET_HOST || '172.16.15.160';

export const TARGETS = {
  restHttp: process.env.SC_REST_HTTP || `http://${HOST}:18080`,
  restTls: process.env.SC_REST_TLS || `https://${HOST}:18443`,
  urlHttp: process.env.SC_URL_HTTP || `http://${HOST}:9090`,
  urlTls: process.env.SC_URL_TLS || `https://${HOST}:9443`,
};

// The collector that actually runs the probe. On 172.16.15.68 the default/Collector164
// (172.16.15.217) is offline, so the LOCAL collector "motadata1568" must be selected.
// Override per-environment with SC_COLLECTOR; empty string => leave the form default.
export const COLLECTOR = process.env.SC_COLLECTOR ?? 'motadata1568';

export const CREDS = {
  user: 'admin',
  pass: 'motadata',
  apiKey: 'motadata-key',
  bearer: 'motadata-bearer',
  oauthClientId: 'motadata',
  oauthClientSecret: 'secret',
};

// Client-certificate PEMs for the Client-Certificate credential profile ("Configure Manually").
// One shared test CA signs BOTH the server cert (on 160) AND this client cert, so Motadata can
// verify the server against `ca` and present `cert`/`key` for a clean mTLS handshake.
export const CLIENT_CERT = {
  cert: `-----BEGIN CERTIFICATE-----
MIIDBTCCAe2gAwIBAgIUc2F9b7opzzzHZ4riCLJELKnXAh8wDQYJKoZIhvcNAQEL
BQAwGzEZMBcGA1UEAwwQbW90YWRhdGEtdGVzdC1jYTAeFw0yNjA3MTMxMjM5MjRa
Fw0zNjA3MTAxMjM5MjRaMBoxGDAWBgNVBAMMD21vdGFkYXRhLWNsaWVudDCCASIw
DQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALd531rtCx5eFAlnG0JOsfltKYil
iL58mkQxwDAozkW9tURxYaqIzJvoBXALasKZ+/qjvpf0bJ2cvHt8rBvcA8qd7nH/
L6SdpxBzo4MTO1ny7Sc7ULXYtLW+ZNi2NN29QlbzLIiA75mSD91JZ8OKe1l6jWfw
ZSeXOWmV4ORp3W5eCX7GKR8+cX0+qRJOsUvvK0bAclbtiRCns0Sj5nUjVyLbXBeI
/JYGPbgBIkh7MlQuo4XhBd/JIZzgdRBAzYl/aUiYhXonAZr3hu8zPQmiGtTKwvxh
og8XwOy9E9mv7VlcI/qBCOCcBJcUnOGYjf6n1TKo9zlHpQvXVOuOxiPNXT8CAwEA
AaNCMEAwHQYDVR0OBBYEFC9Q+PMjuEQmuwuMMQ/YGdLxuAujMB8GA1UdIwQYMBaA
FA1lfxD25iSAl5yGymJr2H0yuns4MA0GCSqGSIb3DQEBCwUAA4IBAQBvGuFu5fu1
DBeKC5GT4zoyaIeziymVsqUMn3CRNi8nyeNpZjD6Pv4A++QXX80/qh0BRsx1tf7m
Tv/vQc6wepT/26+LZgZhFoiWzrQE+NI4TO8Q/ndREy/LfEgfNkXbJM6hFoCPk+9k
v7ks07i86te4eTXzMFYGiQEV0INOD0ardZbJ6XwvRbsnLNzm+aH5trKDl6ys2POk
6IhVQeB7u4YuA9gbMan/7dCj9SBnuNwRDUPlA+9I0pQnpnByxKSM1LBJbSKmg+ij
72NjO4BWaMJkYB/vc5HGIR8w8lvVsUZhY3S3JPN8Kk5/gDxNxJgLnfLv5koWdDx1
07wzd1DH96Kh
-----END CERTIFICATE-----`,
  key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC3ed9a7QseXhQJ
ZxtCTrH5bSmIpYi+fJpEMcAwKM5FvbVEcWGqiMyb6AVwC2rCmfv6o76X9GydnLx7
fKwb3APKne5x/y+knacQc6ODEztZ8u0nO1C12LS1vmTYtjTdvUJW8yyIgO+Zkg/d
SWfDintZeo1n8GUnlzlpleDkad1uXgl+xikfPnF9PqkSTrFL7ytGwHJW7YkQp7NE
o+Z1I1ci21wXiPyWBj24ASJIezJULqOF4QXfySGc4HUQQM2Jf2lImIV6JwGa94bv
Mz0JohrUysL8YaIPF8DsvRPZr+1ZXCP6gQjgnASXFJzhmI3+p9UyqPc5R6UL11Tr
jsYjzV0/AgMBAAECggEAVaHUfLAQ1eoLyP2t68sl5qer0GKOCXXHXFep/vA0obky
jpCqiDjT4loum4ZAnDXZNLhS3sIOJZu/HpVoEJKl1F3UqbD0EA0iqZuHL8h8lXU7
eWmGOHE9mmuTzs9vqiRIf6N8X/NpoI/axqmZe9q4ymDX+bBpzcoXWi/BKGo+lmEU
AOHousRn5j+OlTjiDsBWS2g8yMpL261bVduK6UuueC0goU1x8EwsVZbLki7iM8Fx
ys66YNLdMr5WAQHiSBo0pMMiDpIfDNtErmZx1oxY9b5mtEaOxN+/VIClpMPkvQ1i
PWZWG+CSy7dpc8sbbbw/se68NfpwWlkkWhnMN1SE7QKBgQDfZeOWD7fkwe/YsKwN
PeE9fVLdClm3nSxygWf8H41KfdzCHHh2acJCrCtk3a85vBimDDAdso0GlM++w0Rb
mEbOqL0D2FOsCUTWNoICQB7pCxqKuPOI1Y5wI9ttm74sCg4cEQ7E5dOe5kOXXP/J
G6N8pOi7U25qz8qmqaLrGliUNQKBgQDSQIG1u9WVxxnLiHyLhvOk7t1AMK1ffBmk
9a15SAkFseQZ7uUPRDBKW2GP/xdGp5SnGLXH1BK9T0jglq4N+DJ3lxvsWEk4i0wC
dtt32cB2fND4RO0O6gfkpTYLpqMkGUzOeFl98Lm0B8PIrLYAbI8JTmUYBlEGVmaW
b6JG/BvyIwKBgBPA663iN+2HZJDxllUZaqhIQ6J9/s7om/yICszVcWXr2TBk2hYG
ZgIFPVUO8SaWxkswerS1jBjP4crJc2rx/Rja/NOxNjzZGPgkG7zdNJ6At9kaX5Zy
48Rwtz9q7Rbx0KuUqoyokdzUGZfxxkBfLEaiQl4GE5ZoR1ATYe+OBdUdAoGBAI2S
dATMCuCEpUDgkYReBXcchAxx+nveE2J5LysIL1MPWpl/u+tQrfeTmpkcWi7wLm9p
exWoHkostdTMgTzU0B6ouFungv45BaBvKg6EqEzgdNGHj9xIB7KU8FReC2IGSyqH
7TKZQmIQDGv2p8KXVqUcjYPk1PAgg4lud+W2YpbjAoGAJgyKJdOjFUe09ybc1Fy0
tXgXgCIHBz8WFriAYILb20N5ekVdngH5x+1Q8RQ+Ho/nQPgIZ/DvJ2uhIRVn5Zp4
1XN6iPOr320JpTTHNfNhHka9rRc3m+M0e2Qt80xgIsuuWCGuaONaPZgo8O382vgi
9qFB/4WAxoFttaWjD2yO0H4=
-----END PRIVATE KEY-----`,
  ca: `-----BEGIN CERTIFICATE-----
MIIDFzCCAf+gAwIBAgIUa/n0DEB4YH+3kPQi6pWZ7Lq6QuMwDQYJKoZIhvcNAQEL
BQAwGzEZMBcGA1UEAwwQbW90YWRhdGEtdGVzdC1jYTAeFw0yNjA3MTMxMjM5MjRa
Fw0zNjA3MTAxMjM5MjRaMBsxGTAXBgNVBAMMEG1vdGFkYXRhLXRlc3QtY2EwggEi
MA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDOEDr/8lcKC5JuCF9oumFss331
Oa81ahY0OqBpiwC4t1n/1p5PUuBBwMNiK77ZDqa+KDfWclOiy57EHU8geqeHxAFT
RBeOB2W4gMIHtVFXI9s1WsmCcoPAYUuqD1VWs/B8ZQkSHRf0RSdx1BdXI+6E+WRX
srZBPwh2PiSdJBhXV2uQgbUdWv408gsH22+k3h54ciJlBBFj1HSNXlo2NlvKJnQx
Yh5x2/GHvzdKnAhCRC9FTsrslNOS0mV9Lcxm09pHDm0EQzM36hHZDl9cQGqHADZT
rEGK2VmR1QxV96vZH8/R2JnLFyJ35vzJ3SLjRlS2Z+IJv9VqWQN0F5qn+nGlAgMB
AAGjUzBRMB0GA1UdDgQWBBQNZX8Q9uYkgJechspia9h9Mrp7ODAfBgNVHSMEGDAW
gBQNZX8Q9uYkgJechspia9h9Mrp7ODAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3
DQEBCwUAA4IBAQCu5eor8PyU3N7MaV/YA2uLBnczlmgaIA6Nkvcpx9OwYwjSpe5O
B5aw/dN+xUDbFFiW64u2Tc+PpDx/my6MH+ix7bc4RUe+BXtRZupi5FFCkQ50MhM4
AGEpVZH9cB5Qdcghw8lOsxGlVpyuzErPvoHbicgnTsJuUEGrsmCiLiG6jyNgq1Er
eNN620v2BIM0tk88mqE3ADT4zpzs3s7CLwQEQqSOPCSqPq3nT3Kaaw5a60s+H/18
r8Riv4zRc58OUf/o8PPRAOrs3F6BiyrGYX93iaO6oxSgsML1iKye3Obsb+mZvKwo
RKA+FLcYeH9AglsiuBrp7+NhkIrC5MQRAQoM
-----END CERTIFICATE-----`,
};
