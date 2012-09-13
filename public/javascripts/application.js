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

    dim: function() { $(this).fadeTo('fast', 0.2); },


    linkHandler: function(event){
      var targetTab     = $(event.currentTarget).attr('rel');
      var targetIds     = '#'+SCAPE.plate.tabViews[targetTab].join(', #');
      var fadeInTargets = function(){ $(targetIds).fadeIn(); };

      var nonTargets = $('.scape-ui-block').not(targetIds);

      if (nonTargets.length) {
        nonTargets.fadeOut(fadeInTargets);
      } else {
        fadeInTargets();
      }
    }
  });

  // Extend jQuery...
  $.extend({
    createElement: function(elementName){
      return $(document.createElement(elementName));
    }
  });


  // ########################################################################
  // # Page events....

  $(document).on('pageinit', function(){
    // Trap the carriage return sent by the swipecard reader
    $(document).on("keydown", "input.card-id", function(e) {
      var code=e.charCode || e.keyCode;

      if (code==13) {
        $("#plate_barcode").focus();
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

    // Setup the changing
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
        $('.aliquot').not('.tag-'+originalTag).each(SCAPE.dim);

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

  $(document).on('pageinit','#custom-pooling-page',function(event) {
    var sourceWell        = undefined;
    var destinationWell   = undefined;

     var undimAliquots = function(){
      $('.well, .aliquot').css('opacity', '1.0');
    };

    var setPoolingValue = function(sourceWell, destinationWell) {
      var destination        = getLocation(destinationWell);
      var oldDestination     = getLocation(sourceWell);
      var oldDestinationWell = $('#destination_plate .well[data-location    = ' + oldDestination + ']');

      sourceWell.find('.aliquot').
        text(destination).
        addClass('aliquot source_aliquot ' + SCAPE.coloursByLocation[destination]).
        attr('data-destination-well', destination);

      sourceWell.find('input').val(destination);

      addAliquot(destinationWell);

      resetAliquotCounts();

      $('#destination_plate .well[data-aliquot-count=0]').children().remove();

    };

    function resetAliquotCounts(){
      var poolingDestinations = $('.source_well .aliquot').map(function(_, el){
        return $(el).attr('data-destination-well');
      });

      poolingDestinations = _.uniq(poolingDestinations);

      $('#destination_plate .well').attr('data-aliquot-count', 0);

      _.each(poolingDestinations, function(wellLocation){
        var aliquotCount = $('.source_aliquot[data-destination-well=' + wellLocation + ']').length;

        $('#destination_plate .well[data-location='+ wellLocation + ']').attr('data-aliquot-count', aliquotCount);
      });

    }

    function newAliquot(destinationWell){
      var location = getLocation(destinationWell);
      var aliquot  = $.createElement('div');

      aliquot.
        attr('id', 'aliquot_' + location).
        addClass('aliquot').
        addClass(SCAPE.coloursByLocation[location]).
        text(location);

      return aliquot;
    }

    function addAliquot(destinationWell){
      if (destinationWell.html().trim() === '') {
        destinationWell.append(newAliquot(destinationWell));
      }
    }

    function getLocation(el){
      return $(el).attr('id').match(/^.*_([A-H]\d+)$/)[1];
    }

    function aliquotsByDestination(el){
      return $('.source_aliquot').not(':contains('+ getLocation(el) +')');
    }

    function poolingHandler(){
      setPoolingValue(sourceWell, $(this));
      destinationWell = undefined;
      $('#destination_plate .well').unbind();
      undimAliquots();
    }

    function initialisePoolValues(){
      var i;
      var destination_pools = $('.source_aliquot').map(function(){
        return  [ $(this).text().trim(), $(this).data('pool') ];
      });

      destination_pools = _.uniq(destination_pools);
      for (i=0;i<destination_pools.length; i = i + 2){
        $('#destination_plate .well[data-location=' + destination_pools[i] + ']').attr('data-pool', destination_pools[i+1]);
      }
    }

    // This function ensures that the hidden form values always start with the
    // expected values even if someone reloads the page (otherwise the form will
    // retain the previous values but page won't show them).
    function initialiseTransferFormValues(){
      $('.source_well').each(function(){
        var dest = $(this).find('.aliquot').attr('data-destination-well');
        $(this).find('input').val(dest);
      });
    }

    // Custom pooling code starts here...
    initialisePoolValues();

    initialiseTransferFormValues();

    //Change click to toggle so that operation can be aborted...
    $('.source_well').toggle(
      function(){
        sourceWell    = $(this);
        var sourceAliquot = sourceWell.find('.aliquot');
        var sourcePool    = sourceAliquot.data('pool');

        // Dim other source wells...
        $('.source_aliquot').not(sourceAliquot).each(SCAPE.dim);

        // Remove highlighting behaviour from aliquots on destination plate
        $('#destination_plate .aliquot').unbind();

        // dim wells used by other submissions...
        $('#destination_plate .well').not('[data-pool=""]').not('[data-pool=' + sourcePool + ']').each(SCAPE.dim);

        // Add the handler to unused wells or wells used by this submission...
        $('#destination_plate .well').filter('[data-pool=' + sourcePool +'],[data-pool=""]').click(poolingHandler);
      },

      function() {
        $('#destination_plate .well').unbind();
        undimAliquots();
      }
    );

    resetAliquotCounts();
  });
})(window, jQuery);

