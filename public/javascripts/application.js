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


    linkHandler: function(event){
      var targetTab  = $(event.currentTarget).attr('rel');
      var targetIds  = '#'+SCAPE.plate.tabViews[targetTab].join(', #');
      var nonTargets = $('.scape-ui-block').not(targetIds);

      nonTargets.fadeOut();
      nonTargets.promise().done(function(){ $(targetIds).fadeIn(); });
    }
  });

  // Extend jQuery...
  $.extend($.fn, {
    dim: function() { this.fadeTo('fast', 0.2); return this; }
  });


  // ########################################################################
  // # Page events....

  $(document).on('pageinit', function(){
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

    $(document).on('click','.navbar-link', SCAPE.linkHandler);
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
        var tags = $(window.tag_layouts[$('#plate_tag_layout_template_uuid option: selected').text()]);

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

    // Pure function
    SCAPE.preCapPools = function(sequencingPools, masterPlexLevel){
      var wells, transfers = {};

      for (var pool in sequencingPools) {
        wells           = SCAPE.plate.sequencingPools[pool].wells;
        transfers[pool] = SCAPE.preCapPool(wells, masterPlexLevel);
      }
      return transfers;
    };

    // Pure function
    // Takes a sequencingPool data structure and an integer plexLevel
    // Returns an array of arrays
    // each sub array representing a pre-cap pool
    SCAPE.preCapPool = function(sequencingPool, plexLevel){
      var pool = [];

      for (var i =0; i < sequencingPool.length; i = i + plexLevel){
        pool.push(sequencingPool.slice(i, i + plexLevel));
      }

      return pool;
    };

    // Pure function
    SCAPE.newAliquot = function(poolNumber, wellText){
      return $(document.createElement('div')).
        addClass('aliquot colour-' + poolNumber).
        text(wellText || '\u00A0').
        hide();
    };

    // Pure function
    // Takes a preCapPools data structure
    // Returns an array of arrays containing the Pre-Cap pools in order:-
    // [
    //    [FIRST PRECAP POOL],
    //    [SECOND PRECAP POOL],
    //    ...
    //    [ 'A12', 'B12', ... ]
    // ]
    SCAPE.unwrappedPools = function(preCapPools){
      var pool, seqPool, unwrappedPools = [];

      for (seqPool in preCapPools){
        for (pool in preCapPools[seqPool]){
          unwrappedPools.push(preCapPools[seqPool][pool]);
        }
      }

      return unwrappedPools;
    };


    SCAPE.renderDestinationPools = function(unwrappedPools){
      var well, newInput, source_well;

      $('.destination-plate .well').empty();
      $('.destination-plate input').detach();

      for (var i = 0, l = unwrappedPools.length; i < l; i++){
        well = $('.destination-plate .well_' + SCAPE.WELLS_IN_COLUMN_MAJOR_ORDER[i]);
        well.append(SCAPE.newAliquot(i + 1, SCAPE.WELLS_IN_COLUMN_MAJOR_ORDER[i]));

        for (var j in unwrappedPools[i]){
          source_well = unwrappedPools[i][j];

          newInput = $(document.createElement('input'));
          newInput.attr('name', 'plate[transfers]['+source_well+']');
          newInput.attr('type', 'hidden');
          newInput.val(SCAPE.WELLS_IN_COLUMN_MAJOR_ORDER[i]);

          $('.destination-plate').append(newInput);
        }
      }
    };


    SCAPE.renderSourceWells = function(unwrappedPools){
      $('.source-plate .well').empty();

      for (var poolIndex = 0, count = unwrappedPools.length; poolIndex < count; poolIndex++){

        for (var wellIndex in unwrappedPools[poolIndex]){
          $('.source-plate .well_'+unwrappedPools[poolIndex][wellIndex]).
            append(
              SCAPE.newAliquot(poolIndex+1,
              SCAPE.WELLS_IN_COLUMN_MAJOR_ORDER[poolIndex]) );
        }

      }
    };

    $(document).on('change', '#master-plex-level', function(event){
      // Forms return strings! Always a fun thing to forget...
      var plexLevel   = parseInt($(event.currentTarget).val(), 10);
      var preCapPools = SCAPE.preCapPools( SCAPE.plate.sequencingPools, plexLevel );
      var unwrappedPools = SCAPE.unwrappedPools(preCapPools);

      SCAPE.renderDestinationPools(unwrappedPools);
      SCAPE.renderSourceWells(unwrappedPools);

      $('.aliquot').fadeIn('slow');
    });

    $('#master-plex-level').trigger('change');
    $('.create-button').button('disable');
  });



})(window, jQuery);

