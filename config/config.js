module.exports = {
  name: 'AlienVaultOTX',
  acronym: 'AVOTX',
  defaultColor: 'light-pink',
  description: 'Return Pulse and passive DNS information from AlienVault OTX',
  entityTypes: ['domain', 'IPv4', 'hash'],
  styles: ['./styles/otx.less'],
  block: {
    component: {
      file: './components/block.js'
    },
    template: {
      file: './templates/block.hbs'
    }
  },
  summary: {
    component: {
      file: './components/summary.js'
    },
    template: {
      file: './templates/summary.hbs'
    }
  },
  request: {
    // Provide the path to your certFile. Leave an empty string to ignore this option.
    // Relative paths are relative to the OTX integration's root directory
    cert: '',
    // Provide the path to your private key. Leave an empty string to ignore this option.
    // Relative paths are relative to the OTX integration's root directory
    key: '',
    // Provide the key passphrase if required.  Leave an empty string to ignore this option.
    // Relative paths are relative to the OTX integration's root directory
    passphrase: '',
    // Provide the Certificate Authority. Leave an empty string to ignore this option.
    // Relative paths are relative to the OTX integration's root directory
    ca: '',
    // An HTTP proxy to be used. Supports proxy Auth with Basic Auth, identical to support for
    // the url parameter (by embedding the auth info in the uri)
    proxy: '',
    // If set to false, the integration will ignore SSL errors.  This will allow the integration to connect
    // to the response without valid SSL certificates.  Please note that we do NOT recommending setting this
    // to false in a production environment.
    rejectUnauthorized: true
  },
  logging: { level: 'info' },
  options: [
    {
      key: 'apiKey',
      name: 'API Key',
      description: 'AlienVaultOTX API key',
      default: '',
      type: 'password',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'blocklist',
      name: 'Ignored Domain List',
      description: 'Comma delimited list of domains you do not wish to search (exact matches required).',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: false
    },
    {
      key: 'domainBlocklistRegex',
      name: 'Ignored Domain Regex',
      description:
        'Domains that match the given regex will not be searched.',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: false
    },
    {
      key: 'ipBlocklistRegex',
      name: 'Ignored IP Regex',
      description:
        'IP Addresses that match the given regex will not be searched.',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: false
    },
    {
      key: 'pulses',
      name: 'Hide Results without Pulses',
      description:
        'If checked, the integration will not display a result if there are no related Pulses',
      default: true,
      type: 'boolean',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'maxConcurrent',
      name: 'Max Concurrent Search Requests',
      description:
          'Maximum number of concurrent search requests (defaults to 10).  Integration must be restarted after changing this option.',
      default: 10,
      type: 'number',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'minTime',
      name: 'Minimum Time Between Searches',
      description:
          'Minimum amount of time in milliseconds between each entity search (defaults to 25).  Integration must be restarted after changing this option.',
      default: 25,
      type: 'number',
      userCanEdit: false,
      adminOnly: true
    }
  ]
};
