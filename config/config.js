module.exports = {
  name: 'AlienVaultOTX',
  acronym: 'AVOTX',
  description: 'AlienVaultOTX api integration',
  entityTypes: ['domain', 'IPv4', 'hash'],
  styles: ['./styles/otx.less'],
  block: {
    component: {
      file: './components/otx-block.js'
    },
    template: {
      file: './templates/otx-block.hbs'
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
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'blocklist',
      name: 'Ignored Domain List',
      description: 'List of domains that you never want to send to AlienVaultOTX',
      default: '',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'domainBlocklistRegex',
      name: 'Ignored Domain Regex',
      description:
        'Domains that match the given regex will not be looked up.',
      default: '',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'ipBlacklistRegex',
      name: 'Ignored IP Regex',
      description:
        'IPs that match the given regex will not be looked up.',
      default: '',
      type: 'text',
      userCanEdit: true,
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
    }
  ]
};
