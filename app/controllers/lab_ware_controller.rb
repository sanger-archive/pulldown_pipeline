class LabWareController < ApplicationController
  before_filter :locate_lab_ware, :on => [ :show, :update ]
  def locate_lab_ware
    @lab_ware = locate_lab_ware_identified_by(params[:id])
  end
  private :locate_lab_ware

  before_filter :get_printers, :on => [ :show, :update ]
  def get_printers
    @printers = api.barcode_printer.all
  end
  private :get_printers

  def state_changer_for(purpose_uuid, labware_uuid)
    StateChangers.lookup_for(purpose_uuid).new(api, labware_uuid, current_user_uuid)
  end
  private :state_changer_for


  def show
    @presenter = presenter_for(@lab_ware)
    respond_to do |format|
      format.html { render @presenter.page }
      format.csv
    end
  end

  def update
    state_changer_for(params[:purpose_uuid], params[:id]).move_to!(params[:state], params[:reason])

    respond_to do |format|
      format.html { 
        redirect_to(
          search_path,
          :notice => "Labware: #{params[:labware_ean13_barcode]} has been changed to a state of #{params[:state].titleize}"
        )
      }
    end
  end

end
