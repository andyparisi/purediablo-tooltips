var $ = $ || jQuery;
$(document).ready(function () {
  var marketValues = [
    { value: 1, name: 'Perfect Gem', file: 'perfect_topaz.png' },
    { value: 2, name: 'Perfect Skull', file: 'perfect_skull.png' },
    { value: 3, name: 'Lum', file: 'lum_rune.png' },
    { value: 4, name: 'Ko', file: 'ko_rune.png' },
    { value: 5, name: 'Fal', file: 'fal_rune.png' },
    { value: 6, name: 'Lem', file: 'lem_rune.png' },
    { value: 12, name: 'Pul', file: 'pul_rune.png' },
    { value: 24, name: 'Um', file: 'um_rune.png' },
    { value: 50, name: 'Mal', file: 'mal_rune.png' },
    { value: 100, name: 'Ist', file: 'ist_rune.png' },
    { value: 125, name: 'Gul', file: 'gul_rune.png' },
    { value: 200, name: 'Cham', file: 'cham_rune.png' },
    { value: 250, name: 'Vex', file: 'vex_rune.png' },
    { value: 450, name: 'Zod', file: 'zod_rune.png' },
    { value: 650, name: 'Ohm', file: 'ohm_rune.png' },
    { value: 1050, name: 'Sur', file: 'sur_rune.png' },
    { value: 1150, name: 'Lo', file: 'lo_rune.png' },
    { value: 1750, name: 'Jah', file: 'jah_rune.png' },
    { value: 2150, name: 'Ber', file: 'ber_rune.png' }
  ];
  var itemTooltipData = {},
    $tooltipLinks = $('[data-autolink-id], .tooltip-link'),
    $tooltip = $('.item-tooltip'),
    $pricing = $('.item-tooltip-pricing'),
    $pricingLow = $('.pricing-content-low'),
    $pricingHigh = $('.pricing-content-high'),
    $attrs = $('.item-tooltip-attrs'),
    $title = $('.item-tooltip-title'),
    $type = $('.item-tooltip-type'),
    runeValueUrlPrefix = 'https://www.purediablo.com/wp-content/uploads/2021/04/';

  /**
   * Calculates the market value of the item
   */
  function getMarketValue(price) {
    var i = marketValues.length - 1,
        output = [];

    while (i >= 0) {
      var val = marketValues[i];
      var value = val.value;
      var name = val.name;
      var quotient = price / value;
      
      // How many of this rune can we get?
      if (quotient >= 1) {
        for (var j = 0; j < Math.floor(quotient); j++) {
          output.push(val);
        }
        price = price % value;
      }

      // End the loop when we are all used up
      if (price === 0) {
        break;
      }
          
      i--;
    }

    return output;
  }

  /**
   * Creates an array of modifiers based on the property name
   */
  function parseModifiers(data) {
    var modifiers = [];
    for (var prop in data) {
      if (data.hasOwnProperty(prop) && prop.search('_modifier_') > -1 && data[prop] !== 'NULL') {
        modifiers.push(data[prop]);
      }
    }
    return modifiers;
  }

  /**
   * Fetches the item data from the JSON API
   */
  function getItemData(tooltipId) {
    return new Promise(function (resolve, reject) {
      var url = 'https://www.purediablo.com/wp-json/wp/v2/item?slug=' + tooltipId;
      $.ajax({
        url: url,
      })
        .then(function (data) {
          return resolve(data[0]);
        })
        .catch(function (err) {
          return resolve(null);
        });
    });
  }

  /**
   * Figures out which CSS class is returned based on the quality property
   */
  function getQualityClass(quality) {
    switch (quality) {
      case 'UNIQUE':
        return 'item-quality-unique';
      case 'SET':
        return 'item-quality-set';
      case 'RARE':
        return 'item-quality-rare';
      case 'MAGIC':
        return 'item-quality-magic';
      default:
        return '';
    }
  }

  /**
   * If not already in the tooltip, appends an attribute row
   */
  function addItemAttribute(attribute, label, qualityClass) {
    qualityClass = qualityClass || '';
    if ($('[data-tooltip-attr="' + label + '"').length === 0) {
      $attrs.append('<div data-tooltip-attr="' + label + '" class="item-tooltip-attr ' + qualityClass + '"><span>' + (label && !label.startsWith('mod_') ? label : '') + '</span>' + attribute + '</div>');
    }
  }

  function addRuneValue(rune, $el) {
    $el.append('<div class="pricing-rune">' + '<img src="' + runeValueUrlPrefix + rune.file + '" /><div class="pricing-rune-name">' + rune.name + '</div></div>');
  }

  /**
   * Determines which modifiers have values we can show
   */
  function hasValue(attribute) {
    return attribute && attribute !== 'NULL' && attribute !== '0';
  }

  /**
   * Empties the tooltip contents
   */
  function emptyTooltip() {
    $title.empty().removeAttr('class').addClass('item-tooltip-title')
    $type.empty().removeAttr('class').addClass('item-tooltip-type')
    $attrs.empty();
    $pricing.removeClass('isVisible');
    $pricingLow.empty();
    $pricingHigh.empty();
  }

  /**
   * Renders the tooltip
   */
  function renderTooltip(data) {
    var attrs = data.acf;
    var modifiers = parseModifiers(data.acf);

    var name = attrs.d2i_item_name,
      type = attrs.d2i_item_type,
      defense = attrs.d2i_defense,
      quality = attrs.d2i_quality,
      durability = attrs.d2i_durability,
      reqLevel = attrs.d2i_required_level,
      reqDex = attrs.d2i_required_dexterity,
      reqStr = attrs.d2i_required_strength,
      dmgTwoHand = attrs.d2i_two_hand_damage,
      dmgOneHand = attrs.d2i_one_hand_dmg,
      weaponSpeed = attrs.d2i_weapon_speed,
      weaponClass = attrs.d2i_weapon_class,
      price_low = attrs.price_low,
      price_high = attrs.price_high;

    var itemQualityClass = getQualityClass(quality);

    $title.html(name).addClass(itemQualityClass);
    $type.html(type).addClass(itemQualityClass);

    // Render the item attributes
    if (hasValue(defense)) {
      addItemAttribute(defense, 'Defense: ', getQualityClass('MAGIC'));
    }
    if (hasValue(dmgOneHand)) {
      addItemAttribute(dmgOneHand, 'One-Hand Damage: ', getQualityClass('MAGIC'));
    }
    if (hasValue(dmgTwoHand)) {
      addItemAttribute(dmgTwoHand, 'Two-Hand Damage: ', getQualityClass('MAGIC'));
    }
    if (hasValue(reqDex)) {
      addItemAttribute(reqDex, 'Required Dexterity: ', getQualityClass());
    }
    if (hasValue(reqStr)) {
      addItemAttribute(reqStr, 'Required Strength: ', getQualityClass());
    }
    if (hasValue(durability)) {
      addItemAttribute(durability, 'Durability: ', getQualityClass());
    }
    if (hasValue(reqLevel)) {
      addItemAttribute(reqLevel, 'Required Level: ', getQualityClass());
    }
    if (hasValue(weaponClass)) {
      addItemAttribute(weaponClass, 'Weapon Class: ', getQualityClass());
    }
    if (hasValue(weaponSpeed)) {
      addItemAttribute(weaponSpeed, 'Base Weapon Speed: ', getQualityClass());
    }
    // Add the rest of the attributes
    modifiers.forEach(function (modifier, index) {
      addItemAttribute(modifier, 'mod_' + index, getQualityClass('MAGIC'));
    });

    // Populate the low price
    if (hasValue(price_low)) {
      price_low.forEach(function (rune) {
        addRuneValue(rune, $pricingLow);
      });
    }

    // Populate the high price
    if (hasValue(price_high)) {
      price_high.forEach(function (rune) {
        addRuneValue(rune, $pricingHigh);
      });
    }

    // Add the market price information if present
    if (price_low.length && price_high.length) {
      $pricing.addClass('isVisible');
    }

    $tooltip.addClass('tooltipIsVisible');
  }

  // Set each autolink's tooltip ID based on the title of the link
  $tooltipLinks.each(function (index, elem) {
    var itemId = $(this).text();

    // Do nothing if there isn't a title
    if (!itemId) {
      return;
    }

    var slug = itemId.toLowerCase().replace(/\s/g, '-');
    slug = slug.replace(/[^A-Za-z0-9-]/g, '');

    if (slug) {
      $(this).attr('data-tooltip-id', slug);
    }

    // Set the hover states
    $(this).mouseover(function (e) {
      var tooltipId = $(this).attr('data-tooltip-id');
      var localDataEntry = itemTooltipData[tooltipId];

      // Get the item's data if it's not stored locally
      if (!itemTooltipData.hasOwnProperty(tooltipId)) {
        getItemData(tooltipId)
          .then(function (itemData) {
            if (itemData) {
              // Set the item data
              itemTooltipData[tooltipId] = itemData;

              // Set the calculated rune values
              itemTooltipData[tooltipId].acf.price_low = getMarketValue(itemData.acf.d2i_price);
              itemTooltipData[tooltipId].acf.price_high = getMarketValue(itemData.acf.d2i_high_price);

              // Render the tooltip
              renderTooltip(itemData);
            }
            // No item data; hide the tooltip
            else {
              itemTooltipData[tooltipId] = undefined;
              $tooltip.removeClass('tooltipIsVisible');
            }
          });
      }
      // Retrieve the tooltip data from the cache after already fetched
      else if (localDataEntry != null) {
        renderTooltip(localDataEntry);
      }
      // Hide the tooltip if there's no data for the link
      else {
        $tooltip.removeClass('tooltipIsVisible');
      }
    }).mouseout(function (e) {
      $tooltip.removeClass('tooltipIsVisible');
      emptyTooltip();
    });
  });

  // Track the tooltip with the mouse
  document.addEventListener('mousemove', function (e) {
    var top = e.pageY,
        left = e.pageX,
        marginBuffer = 20,
        rect = $tooltip[0].getBoundingClientRect(),
        linkRect;

    // Check if we have hovered over a tooltip link
    if (e.target.getAttribute('data-tooltip-id')) {
      linkRect = e.target.getBoundingClientRect();
    }

    if (linkRect == null) {
      return;
    }

    // Re-position left side to stay on screen
    if (left + rect.width > window.innerWidth) {
      left = e.pageX - rect.width - marginBuffer * 2;

      if (left < 0) {
        left = -marginBuffer;
      }
    }

    // Reposition top to stay on screen on short displays
    if (top + rect.height > window.innerHeight) {
      if (linkRect.top <= window.innerHeight / 2) {
        top = top - linkRect.top - marginBuffer;
      }
      else {
        top = top - rect.height;
      }
    }
        
    $tooltip.css({
      top: top + marginBuffer,
      left: left + marginBuffer
    });
  })
});