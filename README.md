# Polarity AlienVault OTX Integration

The Polarity AlienVault OTX integration allows Polarity to search AlienVault OTX's open source API to return pulse information on Hashes, IPs and Domains.

> For more information on AlienVault OTX please see https://otx.alienvault.com

![image](https://user-images.githubusercontent.com/306319/40240545-c0b34080-5a86-11e8-9708-4d14f8eb0fb1.png)


## AlienVault OTX Integration Options


### API Key

In order to use the AlienVault OTX API, you must have a valid API key. To obtain a valid API key, just sign up on AlienVault OTX's website. In your account settings you will be able to get

https://otx.alienvault.com

### Domain Blacklist

This is an alternate option that can be used to specify domains or IPs that you do not want sent to AlienVault OTX.  The data must specify the entire IP or domain to be blocked (e.g., www.google.com is treated differently than google.com).

### Domain Blacklist Regex

This option allows you to specify a regex to blacklist domains.  Any domain matching the regex will not be looked up.  If the regex is left blank then no domains will be blacklisted.

### IP Blacklist Regex

This option allows you to specify a regex to blacklist IPv4 Addresses.  Any IPv4 matching the regex will not be looked up.  If the regex is left blank then no IPv4s will be blacklisted.

### Hide Results without Pulses
If checked, the integration will not display a result if there are no related Pulses

## Installation Instructions

Installation instructions for integrations are provided on the [PolarityIO GitHub Page](https://polarityio.github.io/).

## Polarity

Polarity is a memory-augmentation platform that improves and accelerates analyst decision making.  For more information about the Polarity platform please see:

https://polarity.io/
