module.exports = {
    "name": "AlienVaultOTX",
    "acronym":"AVOTX",
    "description": "AlienVaultOTX api integration",
    "entityTypes": ['domain', 'IPv4', 'hash'],
    "styles":[
        "./styles/otx.less"
    ],
    "block": {
        "component": {
            "file": "./components/otx-block.js"
        },
        "template": {
            "file": "./templates/otx-block.hbs"
        }
    },
    "request": {
        // Provide the path to your certFile. Leave an empty string to ignore this option.
        // Relative paths are relative to the OTX integration's root directory
        "cert": '',
        // Provide the path to your private key. Leave an empty string to ignore this option.
        // Relative paths are relative to the OTX integration's root directory
        "key": '',
        // Provide the key passphrase if required.  Leave an empty string to ignore this option.
        // Relative paths are relative to the OTX integration's root directory
        "passphrase": '',
        // Provide the Certificate Authority. Leave an empty string to ignore this option.
        // Relative paths are relative to the OTX integration's root directory
        "ca": '',
        // An HTTP proxy to be used. Supports proxy Auth with Basic Auth, identical to support for
        // the url parameter (by embedding the auth info in the uri)
        "proxy": ''
    },
    "logging": { level: 'debug'},
    "options":[
        {
            "key"         : "apiKey",
            "name"        : "API Key",
            "description" : "AlienVaultOTX API key",
            "default"     : "default value",
            "type"        : "text",
            "userCanEdit" : false,
            "adminOnly"    : false
        },
        {
            "key"         : "blacklist",
            "name"        : "Blacklist Domains",
            "description" : "List of domains that you never want to send to AlienVaultOTX",
            "default"     : "",
            "type"        : "text",
            "userCanEdit" : false,
            "adminOnly"    : false
        },
        {
            key: "domainBlacklistRegex",
            name: "Domain Black List Regex",
            description: "Domains that match the given regex will not be looked up (if blank, no domains will be black listed)",
            default: "",
            type: "text",
            userCanEdit: false,
            adminOnly: false
        },
        {
            key: "ipBlacklistRegex",
            name: "IP Black List Regex",
            description: "IPs that match the given regex will not be looked up (if blank, no IPs will be black listed)",
            default: "",
            type: "text",
            userCanEdit: false,
            adminOnly: false
        },
        {
            "key"         : "pulses",
            "name"        : "Do Not Display, when no Pulses exsist",
            "description" : "If checked, will not display information with no related Pulses",
            "default"     : true,
            "type"        : "boolean",
            "userCanEdit" : false,
            "adminOnly"    : false
        }
    ]
};
