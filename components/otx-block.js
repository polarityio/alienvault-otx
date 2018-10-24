'use strict';
polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  pulsesPerPage: 10,
  maxPulseTags: 20,
  maxTargetedCountries: 10,
  maxReferences: 10,
  maxGroups: 10,
  maxValidations: 10,
  allPulsesShowing: Ember.computed('details.pulse_info.pulses.length', 'maxPulses', function() {
    return this.get('maxPulses') >= this.get('details.pulse_info.pulses.length');
  }),
  // Gets set on init
  maxPulses: null,
  init() {
    this.set('maxPulses', this.get('pulsesPerPage'));
    this._super(...arguments);
  },
  actions: {
    showMorePulses() {
      this.incrementProperty('maxPulses', this.get('pulsesPerPage'));
    }
  }
});
