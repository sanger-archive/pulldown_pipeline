class SearchController < ApplicationController
  before_filter :clear_current_user!
  before_filter :check_for_login!, :only => [:create_or_find, :stock_plates ]

  def new
  end

  def ongoing_plates
    @search_results = ongoing_plate_search.all(
      Pulldown::Plate,
      :state => [ 'pending', 'started', 'passed' ]
    )
  end

  def stock_plates
    @search_results = stock_plate_search.all(
      Pulldown::Plate,
      :state => [ 'pending', 'passed' ]
    )
  end

  def my_plates
    @search_results = my_plates_search.all(
      Pulldown::Plate,
     :state     => [ 'pending', 'started', 'passed', 'started_fx', 'started_mj', 'qc_complete' ],
     :user_uuid => current_user_uuid
    )

    render :my_plates
  end

  def create_or_find
    params['show-my-plates'] == 'true' ? my_plates : create
  end

  # TODO get rid of this exception spagetti and introduce a search presenter with validation!
  def create
    raise "You have not supplied a labware barcode" if params[:plate_barcode].blank?

    respond_to do |format|
      format.html { redirect_to find_plate(params[:plate_barcode]) }
    end

  rescue => exception
    @search_results = []
    flash[:alert]   = exception.message

    # rendering new without re-searching for the ongoing plates...
    respond_to do |format|
      format.html { render :new }
    end
  end

  def clear_current_user!;  session[:user_uuid] = nil; end
  private :clear_current_user!

  def check_for_login!
    set_user_by_swipecard!(params[:card_id]) if params[:card_id].present?
  end
  private :check_for_login!

  def find_plate(barcode)
    api.search.find(Settings.searches['Find assets by barcode']).first(:barcode => barcode)
  rescue Sequencescape::Api::ResourceNotFound => exception
    raise exception, 'Could not find the plate with the specified barcode'
  end
  private :find_plate


  #TODO Dry plate searches up using meta...
  def ongoing_plate_search
  @ongoing_plate_search ||= api.search.find(
    Settings.searches['Find pulldown plates']
  )
  end
  private :ongoing_plate_search

  def stock_plate_search
  @stock_plate_search ||= api.search.find(
    Settings.searches['Find pulldown stock plates']
  )
  end
  private :stock_plate_search

  def my_plates_search
    @my_plates_search ||= api.search.find(
      Settings.searches['Find pulldown plates for user']
    )
  end
end

