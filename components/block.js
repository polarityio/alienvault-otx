'use strict';
polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  general: Ember.computed.alias('block.data.details.general'),
  dns: Ember.computed.alias('block.data.details.passive_dns'),
  pulsesPerPage: 10,
  maxPulseTags: 20,
  maxTargetedCountries: 10,
  maxReferences: 10,
  maxGroups: 10,
  maxValidations: 10,
  errorMessage: '',
  running: false,
  activeTab: 'pulses',
  isDnsLoaded: Ember.computed('dns', function () {
    return typeof this.get('dns') !== 'undefined';
  }),
  loadingDns: false,
  dnsErrorMessag: '',
  supportsDns: Ember.computed('general.sections', function () {
    const sections = this.get('general.sections');
    return Array.isArray(sections) && sections.indexOf('passive_dns') >= 0;
  }),
  allPulsesShowing: Ember.computed('general.pulse_info.pulses.length', 'maxPulses', function () {
    return this.get('maxPulses') >= this.get('general.pulse_info.pulses.length');
  }),
  alientvaultUrl: Ember.computed('block.entity.type', 'block.entity.values', function () {
    let type = this.get('block.entity.type');
    if (type === 'hash') {
      type = 'file';
    }
    const value = this.get('block.entity.value');
    return `https://otx.alienvault.com/indicator/${type}/${value}`;
  }),
  // Gets set on init
  maxPulses: null,
  init() {
    this.set('maxPulses', this.get('pulsesPerPage'));
    this._super(...arguments);
  },
  actions: {
    changeTab(tab) {
      this.set('activeTab', tab);
      if (tab === 'dns' && this.get('isDnsLoaded') === false) {
        this.loadDns();
      }
    },
    refreshDns: function(){
      this.loadDns();
    },
    showMorePulses() {
      this.incrementProperty('maxPulses', this.get('pulsesPerPage'));
    },
    retryLookup: function () {
      this.set('running', true);
      this.set('errorMessage', '');
      const payload = {
        action: 'RETRY_LOOKUP',
        entity: this.get('block.entity')
      };
      this.sendIntegrationMessage(payload)
        .then((result) => {
          this.set('block.data', result.data);
        })
        .catch((err) => {
          // there was an error
          this.set('errorMessage', JSON.stringify(err, null, 4));
        })
        .finally(() => {
          this.set('running', false);
        });
    }
  },
  loadDns: function () {
    this.set('loadingDns', true);
    this.set('dnsErrorMessage', '');

    const payload = {
      action: 'DNS_LOOKUP',
      entity: this.get('block.entity')
    };

    this.sendIntegrationMessage(payload)
      .then((response) => {
        this.set('dns', response.result);
      })
      .catch((err) => {
        this.set('dnsErrorMessage', JSON.stringify(err, null, 4));
      })
      .finally(() => {
        this.set('loadingDns', false);
      });
  }
});
