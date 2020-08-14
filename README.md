# Polarity AlienVault OTX Integration

The Polarity AlienVault OTX integration allows Polarity to search AlienVault OTX's open source API to return pulse information on Hashes, IPs and Domains.

> For more information on AlienVault OTX please see https://otx.alienvault.com

![image](https://user-images.githubusercontent.com/306319/47399385-3132f980-d706-11e8-876b-7794ab671468.png)


## AlienVault OTX Integration Options


### API Key

In order to use the AlienVault OTX API, you must have a valid API key. To obtain a valid API key, just sign up on AlienVault OTX's website. In your account settings you will be able to get

https://otx.alienvault.com

### Ingore Domain List

This is an alternate option that can be used to specify domains that you do not want sent to AlienVault OTX. The data must specify the entire domain to be blocked (e.g., www.google.com is treated differently than google.com).

### Ignore Domain Regex

Ingore regex used to not lookup any domains matching the regex. 

### Ignore IP Regex

Ingore regex used to not lookup any ips matching the regex. 

### Hide Results without Pulses
If checked, the integration will not display a result if there are no related Pulses

## Installation Instructions

Installation instructions for integrations are provided on the [PolarityIO GitHub Page](https://polarityio.github.io/).

## Polarity

Polarity is a memory-augmentation platform that improves and accelerates analyst decision making.  For more information about the Polarity platform please see:

https://polarity.io/
