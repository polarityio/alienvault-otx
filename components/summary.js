'use strict';
polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  general: Ember.computed.alias('block.data.details.general')
});
