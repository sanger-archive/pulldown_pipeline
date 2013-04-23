var global_grabber

$.ajaxSetup({
  beforeSend: function(xhr) {
    xhr.setRequestHeader('X-CSRF-Token', $('meta[name="csrf-token"]').attr('content'));
  }
});

(function(window, $, undefined){
  "use strict";

  // Set up the SCAPE namespace
  if (window.SCAPE === undefined) {
    window.SCAPE = {};
  }

  // Extend SCAPE as it could have already been defined in the view.
  $.extend(SCAPE, {
    //temporarily used until page ready event sorted... :(
    //This is a copy of the template held in the tagging page.
    tag_palette_template :
      '<li class="ui-li ui-li-static ui-body-c">'+
      '<div class="available-tag palette-tag"><%= tag_id %></div>&nbsp;&nbsp;Tag <%= tag_id %>'+
      '</li>',

    //temporarily used until page ready event sorted... :(
    //This is a copy of the template held in the tagging page.
    substitution_tag_template:
      '<li class="ui-li ui-li-static ui-body-c" data-split-icon="delete">'+
      '<div class="substitute-tag palette-tag"><%= original_tag_id %></div>&nbsp;&nbsp;Tag <%= original_tag_id %> replaced with Tag <%= replacement_tag_id %>&nbsp;&nbsp;<div class="available-tag palette-tag"><%= replacement_tag_id %></div>'+
      '<input id="plate-substitutions-<%= original_tag_id %>" name="plate[substitutions][<%= original_tag_id %>]" type="hidden" value="<%= replacement_tag_id %>" />'+
      '</li>',

    displayReason: function() {
      if ($('.reason:visible').length === 0) {
        $('#'+$('#state option:selected').val()).slideDown('slow').find('select:disabled').removeAttr('disabled');
      }
      else {
        $('.reason').not('#'+$('#state option:selected').val()).slideUp('slow', function(){
          $('#'+$('#state option:selected').val()).slideDown('slow').find('select:disabled').removeAttr('disabled');
        });
      }

    },

    WELLS_IN_COLUMN_MAJOR_ORDER: ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "A2", "B2", "C2", "D2", "E2", "F2", "G2", "H2", "A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3", "A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "A5", "B5", "C5", "D5", "E5", "F5", "G5", "H5", "A6", "B6", "C6", "D6", "E6", "F6", "G6", "H6", "A7", "B7", "C7", "D7", "E7", "F7", "G7", "H7", "A8", "B8", "C8", "D8", "E8", "F8", "G8", "H8", "A9", "B9", "C9", "D9", "E9", "F9", "G9", "H9", "A10", "B10", "C10", "D10", "E10", "F10", "G10", "H10", "A11", "B11", "C11", "D11", "E11", "F11", "G11", "H11", "A12", "B12", "C12", "D12", "E12", "F12", "G12", "H12"],


    linkCallbacks: $.Callbacks(),

    linkHandler: function(event){
      var targetTab  = $(event.currentTarget).attr('rel');
      var targetIds  = '#'+SCAPE.plate.tabViews[targetTab].join(', #');
      var nonTargets = $('.scape-ui-block').not(targetIds);

      nonTargets.fadeOut();
      nonTargets.promise().done(function(){ $(targetIds).fadeIn(); });
    },


    StateMachine: function(delegateTarget, states){
      var sm             = this;
      var stateNames     = _.keys(states);
      var stateCallbacks = {};
      sm.delegateTarget  = $(delegateTarget);

      var beforeCallback = function(event){
        sm.delegateTarget.off();
      };


      var afterCallback = function(newState){
        sm.currentState = newState;
      };


      var callbacks, otherStates;
      for (var stateName in states){
        otherStates = _.difference(stateNames, stateName);

        callbacks = [
          beforeCallback,
          states[stateName].enter
        ];

        callbacks = callbacks.concat(otherStates.map(
          function(otherStateName){
            return function(){
              if(sm.currentState === otherStateName)
              return states[otherStateName].leave();
            };
        }
        ));

        callbacks = _.compact(callbacks).concat(afterCallback);

        stateCallbacks[stateName] = $.Callbacks().add(callbacks);
      }


      sm.transitionTo = function(newState){
        if (stateCallbacks[newState] === undefined) throw "Unknown State: " + newState;

        stateCallbacks[newState].fire(newState, sm.delegateTarget);
      };


      sm.transitionLink = function(e){
        var newState = $.cssToCamel($(e.currentTarget).attr('rel'));
        sm.transitionTo(newState);
      };
    }
  });

  // Extend jQuery...
  $.extend($.fn, {
    dim: function() { this.fadeTo('fast', 0.2); return this; }
  });

  $.extend($, {
    cssToCamel: function(string) {
      return string.replace(/-([a-z])/gi, function(s, group1) {
        return group1.toUpperCase();
      });
    }
  });


  // ########################################################################
  // # Page events....

  $(document).on('pageinit', function(){
    SCAPE.linkCallbacks.add(SCAPE.linkHandler);

    $(document).on('click','.navbar-link', SCAPE.linkCallbacks.fire);

    // Trap the carriage return sent by the swipecard reader
    $(document).on("keydown", "input.card-id", function(e) {
      var code=e.charCode || e.keyCode;

      if (code==13) {
        $('input[data-type="search"], .plate-barcode').last().focus();
        return false;
      }

    });

    var myPlateButtonObserver = function(event){
      if ($(event.currentTarget).val()) {
          $('.show-my-plates-button').button('disable');
      } else if ($('input.card-id').val()) {
          $('.show-my-plates-button').button('enable');
      }
    };

    $(document).on("keyup", ".plate-barcode", myPlateButtonObserver);
    $(document).on("keyup", ".card-id", myPlateButtonObserver);

    // Trap the carriage return sent by barcode scanner
    $(document).on("keydown", ".plate-barcode", function(event) {
      var code=event.charCode || event.keyCode;
      // Check for carrage return (key code 13)
      if (code==13) {
        // Check that the value is 13 characters long like a barcode
        if ($(event.currentTarget).val().length === 13) {
          $(event.currentTarget).closest('form').find('.show-my-plates').val(false);
          $(event.currentTarget).closest('.plate-search-form').submit();
        }
      }
    });

    // Change the colour of the title bar to show a user id
    $(document).on('blur', 'input.card-id', function(event){
      if ($(event.currentTarget).val()) {
        $('.ui-header').removeClass('ui-bar-a').addClass('ui-bar-b');
      } else {
        $('.ui-header').removeClass('ui-bar-b').addClass('ui-bar-a');
      }
    });


    // Fill in the plate barcode with the plate links barcode
    $(document).on('click', ".plate-link", function(event) {
      $('.labware-uuid').val($(event.currentTarget).data('uuid'));
      $('.show-my-plates').val(false);
      $('.plate-search-form').submit();
      return false;
    });


    // Disable submit buttons after first click...
    $(document).on('submit', 'form', function(event){
      $(event.currentTarget).find(':submit').
        button('disable').
        prev('.ui-btn-inner').
        find('.ui-btn-text').
        text('Working...');

      return true;
    });

  });

  $(document).on('pagecreate','#plate-show-page', function(event) {

    var tabsForState = '#'+SCAPE.plate.tabStates[SCAPE.plate.state].join(', #');

    $('#navbar li').not(tabsForState).remove();
    $('#'+SCAPE.plate.tabStates[SCAPE.plate.state][0]).find('a').addClass('ui-btn-active');

  });

  $(document).on('pageinit','#plate-show-page', function(event){
    var targetTab = SCAPE.plate.tabStates[SCAPE.plate.state][0];
    var targetIds = '#'+SCAPE.plate.tabViews[targetTab].join(', #');

    $(targetIds).not(':visible').fadeIn();

    $('#well-failing .plate-view .aliquot').
      not('.permanent-failure').
      toggle(
        function(){
      $(this).hide('fast', function(){
        var failing = $(this).toggleClass('good failed').show().hasClass('failed');
        $(this).find('input:hidden')[failing ? 'attr' : 'removeAttr']('checked', 'checked');
      });
    },

    function() {
      $(this).hide('fast', function(){
        var failing = $(this).toggleClass('failed good').show().hasClass('failed');
        $(this).find('input:hidden')[failing ? 'attr' : 'removeAttr']('checked', 'checked');
      });
    }
    );

    // State changes reasons...
    SCAPE.displayReason();
    $(document).on('change','#state', SCAPE.displayReason);
  });


  $(document).on('pageinit','#admin-page',function(event) {

    $('#plate_edit').submit(function() {
      if ($('#card_id').val().length === 0) {
        alert("Please scan your swipecard...");
        return false;
      }
    });

    // Trap the carriage return sent by the swipecard reader
    $(document).on("keydown","#card_id", function(e) {
      var code=e.charCode || e.keyCode;
      if (code==13) return false;
    });

    SCAPE.displayReason();
    $(document).on('click','#state',SCAPE.displayReason);
  });

  $(document).on('pageinit','#creation-page',function(event) {
    var transfers = {
       'Transfer columns 1-1': '.col-1',
       'Transfer columns 1-2': '.col-1,.col-2',
       'Transfer columns 1-3': '.col-1,.col-2,.col-3',
       'Transfer columns 1-4': '.col-1,.col-2,.col-3,.col-4',
       'Transfer columns 1-6': '.col-1,.col-2,.col-3,.col-4,.col-5,.col-6',
      'Transfer columns 1-12': '.col-all'
    };

    function template_display(){
      var selectedColumns = transfers[$('#plate_transfer_template_uuid option:selected').text()];
      var aliquots = $('#transfer-plate .aliquot');
      aliquots.not(selectedColumns).hide('slow');
      aliquots.filter(selectedColumns).show('slow');
    }

    $('#plate_transfer_template_uuid').change(template_display);
  });


  $(document).on('pageinit','#tag-creation-page', function(){

    $.extend(window.SCAPE, {

        tagpaletteTemplate: _.template(SCAPE.tag_palette_template),
      substitutionTemplate: _.template(SCAPE.substitution_tag_template),

      updateTagpalette  : function() {
        var tagpalette = $('#tag-palette');

        tagpalette.empty();

        var currentTagGroup   = window.tags_by_name[$('#plate_tag_layout_template_uuid option:selected').text()];
        var currentlyUsedTags = $('.aliquot').map(function(){ return parseInt($(this).text(), 10); });
        var unusedTags        = _.difference(currentTagGroup, _.sortBy(currentlyUsedTags, function(n){return n;}) );
        var listItems         = unusedTags.reduce(
          function(memo, tagId) { return memo + SCAPE.tagpaletteTemplate({tag_id: tagId}); }, '<li data-role="list-divider" class="ui-li ui-li-divider ui-btn ui-bar-b ui-corner-top ui-btn-up-undefined">Replacement Tags</li>');

          tagpalette.append(listItems);
          $('#tag-palette li:last').addClass('ui-li ui-li-static ui-body-c ui-corner-bottom');

      },

      tagSubstitutionHandler: function() {
        var sourceAliquot = $(this);
        var originalTag   = sourceAliquot.text();

        // Dim other tags...
        $('.aliquot').not('.tag-'+originalTag).dim();

        SCAPE.updateTagpalette();

        // Show the tag palette...
        $('#instructions').fadeOut(function(){
          $('#replacement-tags').fadeIn();
        });


        function paletteTagHandler() {
          var newTag = $(this).text();

          // Find all the aliquots using the original tag
          // swap their tag classes and text
          $('.aliquot.tag-'+originalTag).
            hide().
            removeClass('tag-'+originalTag).
            addClass('tag-'+newTag).
            text(newTag).
            addClass('selected-aliquot').
            show('fast');

          // Add the substitution as a hidden field and li
          $('#substitutions ul').append(SCAPE.substitutionTemplate({original_tag_id: originalTag, replacement_tag_id: newTag}));
          $('#substitutions ul').listview('refresh');

          SCAPE.resetHandler();
        }
        // Remove old behaviour and add the new to available-tags
        $('.available-tag').unbind().click(paletteTagHandler);

      },


      update_layout: function () {
        var tags = $(window.tag_layouts[$('#plate_tag_layout_template_uuid option:selected').text()]);

        tags.each(function(index) {
          $('#tagging-plate #aliquot_'+this[0]).
            hide('slow').text(this[1][1]).
            addClass('aliquot colour-'+this[1][0]).
            addClass('tag-'+this[1][1]).
            show('slow');
        });

        SCAPE.resetHandler();
        SCAPE.resetSubstitutions();
      },

      resetSubstitutions: function() {
        $('#substitutions ul').empty();
        $('#tagging-plate .aliquot').removeClass('selected-aliquot');
      },

      resetHandler: function() {
        $('.aliquot').css('opacity', 1);
        $('.available-tags').unbind();
        $('#replacement-tags').fadeOut(function(){
          $('#instructions').fadeIn();
        });
      }

    });

    SCAPE.update_layout();
    $('#plate_tag_layout_template_uuid').change(SCAPE.update_layout);
    $('#tagging-plate .aliquot').toggle(SCAPE.tagSubstitutionHandler, SCAPE.resetHandler);

  });


  ////////////////////////////////////////////////////////////////////
  // Custom pooling...
  $(document).on('pageinit','#custom-pooling-page',function(event) {



    SCAPE.preCapPools = function(preCapGroups, masterPlexLevel){
      var wells, failures, transfers = {}, plexLevel;

      for (var group in preCapGroups) {
        wells           = SCAPE.plate.preCapGroups[group].all_wells;
        failures        = SCAPE.plate.preCapGroups[group].failures;
        plexLevel       = SCAPE.plate.preCapGroups[group].pre_capture_plex_level
        transfers[group] = SCAPE.preCapPool(wells, failures, plexLevel);
      }

      return transfers;
    };

    SCAPE.preCapPool = function(sequencingPool, failed, plexLevel){
      plexLevel = plexLevel || 8; // To stop an infinite loop if null or 0 slips through
      var wells = [];
      for (var i =0; i < sequencingPool.length; i = i + plexLevel){
        wells.push(sequencingPool.slice(i, i + plexLevel).filter(function(w) { return failed.indexOf(w) == -1; }));
      }

      return { plexLevel: plexLevel, wells: wells };
    };

    SCAPE.newAliquot = function(poolNumber, poolID, aliquotText){
      var poolNumberInt = parseInt(poolNumber,10);

      return $(document.createElement('div')).
        addClass('aliquot colour-' + (poolNumberInt+1)).
        attr('data-pool-id', poolID).
        text(aliquotText || '\u00A0').
        hide();
    };


    var walkPreCapPools = function(preCapPools, block){
      var poolNumber = -1, seqPoolIndex = -1;
      for (var seqPoolID in preCapPools){
        seqPoolIndex++;

        for (var poolIndex in preCapPools[seqPoolID].wells){
          poolNumber++;
          block(preCapPools[seqPoolID].wells[poolIndex], poolNumber, seqPoolID, seqPoolIndex);
        }
      }
    };


    var renderPoolingSummary = function(preCapPools){

      walkPreCapPools(preCapPools, function(preCapPool, poolNumber, seqPoolID, seqPoolIndex){
        var destinationWell = SCAPE.WELLS_IN_COLUMN_MAJOR_ORDER[poolNumber];
        var listElement = $('<li/>').
          text(SCAPE.WELLS_IN_COLUMN_MAJOR_ORDER[poolNumber]).
          append('<div class="ui-li-count" data-theme="b">'+preCapPool.length+'</div>').
          append('<div class="ui-li-aside">'+preCapPool.join(', ')+'</div>');

        $('#pooling-summary').append(listElement);
      });

      $('#pooling-summary').listview('refresh');
    };


    SCAPE.renderDestinationPools = function(){
      var preCapPools = SCAPE.plate.preCapPools;
      var well;

      $('.destination-plate .well').empty();

      $('.destination-plate .well').removeClass (function (index, css) {
        return (css.match (/\bseqPool-\d+/g) || []).join(' ');
      });

      walkPreCapPools(preCapPools, function(preCapPool, poolNumber, seqPoolID, seqPoolIndex){
        well = $('.destination-plate .' + SCAPE.WELLS_IN_COLUMN_MAJOR_ORDER[poolNumber]);


        well.addClass('seqPool-'+(seqPoolIndex+1));

        if (preCapPool.length)
          well.append(SCAPE.newAliquot(poolNumber, seqPoolID, preCapPool.length));
      });
    };


    SCAPE.renderSourceWells = function(){
      var preCapPools = SCAPE.plate.preCapPools;
      $('.source-plate .well').empty();
      $('#well-transfers').detach();

      var newInputs = $(document.createElement('div')).attr('id', 'well-transfers');

      walkPreCapPools(preCapPools,function(preCapPool, poolNumber, seqPoolID, seqPoolIndex){
        var newInput, well;

        for (var wellIndex in preCapPool){
          well = $('.source-plate .'+preCapPool[wellIndex]).addClass('seqPool-'+(seqPoolIndex+1));
          well.append( SCAPE.newAliquot(poolNumber, seqPoolID, SCAPE.WELLS_IN_COLUMN_MAJOR_ORDER[poolNumber]));

          newInput = $(document.createElement('input')).
            attr('name', 'plate[transfers]['+preCapPool[wellIndex]+']').
            attr('type', 'hidden').
            val(SCAPE.WELLS_IN_COLUMN_MAJOR_ORDER[poolNumber]);

          newInputs.append(newInput);
        }

      });

      $('.source-plate').append(newInputs);
    };

    var plateSummaryHandler = function(){

      SCAPE.renderSourceWells();
      SCAPE.renderDestinationPools();

      $('.aliquot').fadeIn('slow');
    };

    var selectSeqPoolHandler = function(event){
      SCAPE.plate.currentPool = poolIdFromLocation(
        SCAPE.plate.preCapGroups,
        $(event.currentTarget).closest('.well').data('location'));

        SCAPE.poolingSM.transitionTo('editPoolSelected');
    };

    var poolIdFromLocation = function(preCapGroups, location){
      return _.detect(
        preCapGroups,
        function(pool){ return _.contains(pool.wells, location); }
      ).id;
    };

    var highlightCurrentPool = function(){
      $('.aliquot[data-pool-id!="'+SCAPE.plate.currentPool+'"]').
        removeClass('big-aliquot selected-aliquot').
        dim();

      $('.aliquot[data-pool-id="'+SCAPE.plate.currentPool+'"]').
        css('opacity',1).
        addClass('selected-aliquot');
    };


    SCAPE.poolingSM = new SCAPE.StateMachine('.ui-content', {

      'editPool': {
        enter: function(_, delegateTarget){
          delegateTarget.on('click', '.source-plate .aliquot', selectSeqPoolHandler);

          $('.destination-plate').css('opacity',0.3);
          $('.source-plate .aliquot').addClass('big-aliquot');
        },

        leave: function(){
          $('.destination-plate').css('opacity',1);

          $('.aliquot').
            removeClass('selected-aliquot big-aliquot');
        }
      },

      'editPoolSelected': {
        enter: function(_, delegateTarget){

          delegateTarget.on('click', '.source-plate .aliquot', selectSeqPoolHandler);

          // We need to grab events on the slider for grab and release...
          var slider = $('#per-pool-plex-level').
            val(SCAPE.plate.preCapPools[SCAPE.plate.currentPool].plexLevel).
            textinput('enable').
            slider('enable').
            siblings('.ui-slider');

          delegateTarget.on('change', '#per-pool-plex-level', function(event){
            var plexLevel = parseInt($(event.currentTarget).val(), 10);

            SCAPE.plate.preCapPools[SCAPE.plate.currentPool] =
              SCAPE.preCapPool(SCAPE.plate.preCapGroups[SCAPE.plate.currentPool].all_wells, SCAPE.plate.preCapGroups[SCAPE.plate.currentPool].failures, plexLevel );

            SCAPE.renderSourceWells();
            SCAPE.renderDestinationPools();

            highlightCurrentPool();
            $('.aliquot').fadeIn('slow');
          });


          highlightCurrentPool();
        },

        leave: function(){
          $('.aliquot').css('opacity', 1).removeClass('selected-aliquot');
          $('#per-pool-plex-level').textinput('disable').slider('disable').val('');
          SCAPE.plate.currentPool = undefined;
        }
      },

      'poolingSummary': {
        enter: function(){
          plateSummaryHandler();
          renderPoolingSummary(SCAPE.plate.preCapPools);
          $('.create-button').button('enable');
        },

        leave: function(){
          $('#pooling-summary').empty();
          $('.create-button').button('disable');
        }
      }
    });

    SCAPE.linkCallbacks.add(SCAPE.poolingSM.transitionLink);
    // Calculate the pools and render the plate
    SCAPE.plate.preCapPools = SCAPE.preCapPools( SCAPE.plate.preCapGroups, null );
    SCAPE.poolingSM.transitionTo('poolingSummary');

    $('.create-button').button('enable');
  });


  ////////////////////////////////////////////////////////////////////
  // Multi Plate Custom pooling...
  $(document).on('pageinit','#multi-plate-pooling-page',function(event) {

    $.extend(SCAPE, {
      retrievePlate : function(plate) {
        plate.ajax = $.ajax({
          dataType: "json",
          url: '/search/',
          type: 'POST',
          data: 'plate_barcode='+plate.value,
          success: function(data,status) { plate.checkPlate(data,status); }
        }).fail(function(data,status) { if (status!=='abort') { plate.badPlate(); } });
      }
    })

    $('.plate-box').on('change', function() {
      // When we scan in a plate
      if (this.value === "") { this.scanPlate(); } else { this.waitPlate(); SCAPE.retrievePlate(this); };
    });

    $('.plate-box').each(function(){

      $.extend(this, {
        /*
          Our plate beds
        */
        waitPlate : function() {
          this.clearPlate();
          $(this).closest('.plate-container').removeClass('good-plate bad-plate scan-plate');
          $(this).closest('.plate-container').addClass('wait-plate');
        },
        scanPlate : function() {
          this.clearPlate();
          $(this).closest('.plate-container').removeClass('good-plate wait-plate bad-plate');
          $(this).closest('.plate-container').addClass('scan-plate');
        },
        badPlate : function() {
          this.clearPlate();
          $(this).closest('.plate-container').removeClass('good-plate wait-plate scan-plate');
          $(this).closest('.plate-container').addClass('bad-plate');
        },
        goodPlate : function() {
          $(this).closest('.plate-container').removeClass('bad-plate wait-plate scan-plate');
          $(this).closest('.plate-container').addClass('good-plate');
        },
        checkPlate : function(data,status) {
          if (data.plate.state===SCAPE.sourceState && data.plate.purpose==SCAPE.sourcePurpose) {
            SCAPE.plates[$(this).data('position')] = data.plate;
            this.goodPlate();
          } else {
            this.badPlate();
          }
        },
        clearPlate : function() {
          SCAPE.plates[$(this).data('position]')] = undefined;
        }
      })

    })

    SCAPE.calculatePreCapPools = function() {
      for (var plateIndex in SCAPE.plates){
            var plate = SCAPE.plates[plateIndex];
            if (plate!==undefined) { SCAPE.plates[plateIndex].preCapPools = SCAPE.preCapPools( SCAPE.plates[plateIndex] )}
          }
    };

    SCAPE.preCapPools = function(plate){
      var wells, failures, transfers = {}, plexLevel;

      for (var group in plate.preCapGroups) {
        wells           = plate.preCapGroups[group].all_wells;
        failures        = plate.preCapGroups[group].failures;
        plexLevel       = plate.preCapGroups[group].pre_capture_plex_level
        transfers[group] = SCAPE.preCapPool(wells, failures, plexLevel);
      }

      return transfers;
    };

    SCAPE.preCapPool = function(sequencingPool, failed, plexLevel){
      plexLevel = plexLevel || 8; // To stop an infinite loop if null or 0 slips through
      var wells = [];
      for (var i =0; i < sequencingPool.length; i = i + plexLevel){
        wells.push(sequencingPool.slice(i, i + plexLevel).filter(function(w) { return failed.indexOf(w) == -1; }));
      }

      return { plexLevel: plexLevel, wells: wells };
    };

    SCAPE.newAliquot = function(poolNumber, poolID, aliquotText){
      var poolNumberInt = parseInt(poolNumber,10);

      return $(document.createElement('div')).
        addClass('aliquot colour-' + (poolNumberInt+1)).
        attr('data-pool-id', poolID).
        text(aliquotText || '\u00A0').
        hide();
    };


    var walkPreCapPools = function(preCapPools, block){
      var poolNumber = -1, seqPoolIndex = -1;
      for (var seqPoolID in preCapPools){
        seqPoolIndex++;

        for (var poolIndex in preCapPools[seqPoolID].wells){
          poolNumber++;
          block(preCapPools[seqPoolID].wells[poolIndex], poolNumber, seqPoolID, seqPoolIndex);
        }
      }
      return poolNumber+1;
    };


    var renderPoolingSummary = function(plates){
      var capPoolOffset = 0;

      for (var i in plates) {
        if (plates[i]===undefined) {
        } else {
          var preCapPools = plates[i].preCapPools
          capPoolOffset += walkPreCapPools(preCapPools, function(preCapPool, poolNumber, seqPoolID, seqPoolIndex){
            var destinationWell = SCAPE.WELLS_IN_COLUMN_MAJOR_ORDER[capPoolOffset+poolNumber];
            var listElement = $('<li/>').
              text(SCAPE.WELLS_IN_COLUMN_MAJOR_ORDER[capPoolOffset+poolNumber]).
              append('<div class="ui-li-count" data-theme="b">'+preCapPool.length+'</div>').
              append('<div class="ui-li-aside">'+plates[i].barcode+': '+preCapPool.join(', ')+'</div>');
            $('#pooling-summary').append(listElement);
          });
          $('#pooling-summary').listview('refresh');
        };
      };
    };

    SCAPE.renderDestinationPools = function(){

      $('.destination-plate .well').empty();
      $('.destination-plate .well').removeClass (function (index, css) {
        return (css.match (/\bseqPool-\d+/g) || []).join(' ');
      });

      var capPoolOffset = 0;
      var seqPoolOffset = 0;
      for (var plateIndex = 0; plateIndex < SCAPE.plates.length; plateIndex += 1) {
        if (SCAPE.plates[plateIndex]!==undefined) {
          var preCapPools = SCAPE.plates[plateIndex].preCapPools;
          var well;
          capPoolOffset += walkPreCapPools(preCapPools, function(preCapPool, poolNumber, seqPoolID, seqPoolIndex){
            well = $('.destination-plate .' + SCAPE.WELLS_IN_COLUMN_MAJOR_ORDER[capPoolOffset+poolNumber]);
            well.addClass('seqPool-'+(seqPoolOffset+seqPoolIndex+1));
            if (preCapPool.length)
              well.append(SCAPE.newAliquot(capPoolOffset+poolNumber, seqPoolID, preCapPool.length));
          });
        for (var i in SCAPE.plates[0].preCapPools) { seqPoolOffset +=1 };
        }
      }
    };


    SCAPE.renderSourceWells = function(){
      var capPoolOffset = 0;
      var seqPoolOffset = 0;
      for (var plateIndex = 0; plateIndex < SCAPE.plates.length; plateIndex += 1) {
        if (SCAPE.plates[plateIndex]===undefined) {
          $('.plate-id-'+plateIndex).hide();
        } else {

          var preCapPools = SCAPE.plates[plateIndex].preCapPools;
          $('.plate-id-'+plateIndex).show();
          $('.plate-id-'+plateIndex+' .well').empty();
          $('#well-transfers-'+plateIndex).detach();

          var newInputs = $(document.createElement('div')).attr('id', 'well-transfers-'+plateIndex);

          capPoolOffset += walkPreCapPools(preCapPools,function(preCapPool, poolNumber, seqPoolID, seqPoolIndex){
            var newInput, well;

            for (var wellIndex in preCapPool){
              well = $('.plate-id-'+plateIndex+' .'+preCapPool[wellIndex]).addClass('seqPool-'+(seqPoolOffset+seqPoolIndex+1));
              well.append( SCAPE.newAliquot(capPoolOffset+poolNumber, seqPoolID, SCAPE.WELLS_IN_COLUMN_MAJOR_ORDER[capPoolOffset+poolNumber]));

              newInput = $(document.createElement('input')).
                attr('name', 'plate[transfers]['+SCAPE.plates[plateIndex].uuid+']['+preCapPool[wellIndex]+']').
                attr('type', 'hidden').
                val(SCAPE.WELLS_IN_COLUMN_MAJOR_ORDER[capPoolOffset+poolNumber]);

              newInputs.append(newInput);
            }
          });
          for (var i in SCAPE.plates[0].preCapPools) { seqPoolOffset +=1 };
          $('.plate-id-'+plateIndex).append(newInputs);
        }
      }
    };

    var plateSummaryHandler = function(){

      SCAPE.renderSourceWells();
      SCAPE.renderDestinationPools();

      $('.aliquot').fadeIn('slow');
    };

    SCAPE.poolingSM = new SCAPE.StateMachine('.ui-content', {

      'addPlates' :{
        enter: function(){
          $('.create-button').button('disable');
        },

        leave: function(){
          // validatePlates();
        }
      },

      'poolingSummary': {
        enter: function(){
          SCAPE.calculatePreCapPools();
          plateSummaryHandler();
          $('#pooling-summary').empty();
          renderPoolingSummary(SCAPE.plates);
          $('.create-button').button('enable');
        },

        leave: function(){
          $('#pooling-summary').empty();
          $('.create-button').button('disable');
        }
      }
    });

    SCAPE.linkCallbacks.add(SCAPE.poolingSM.transitionLink);
    SCAPE.poolingSM.transitionTo('addPlates');

  });


})(window, jQuery);

