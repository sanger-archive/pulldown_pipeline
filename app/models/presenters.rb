module Presenters
  module Presenter
    def self.included(base)
      base.class_eval do
        include Forms::Form
        write_inheritable_attribute :page, 'show'

        class_inheritable_reader :csv
        write_inheritable_attribute :csv, 'show'

        class_inheritable_reader :has_qc_data?
        write_inheritable_attribute :has_qc_data?, false

        class_inheritable_reader :robot_name
        class_inheritable_reader :bed_prefix
      end
    end

    def default_printer_uuid
      @default_printer_uuid ||= Settings.printers[Settings.purposes[purpose.uuid].default_printer_type]
    end

    def default_label_count
      @default_label_count ||= Settings.printers['default_count']
    end

    def printer_limit
      @printer_limit ||= Settings.printers['limit']
    end

    def save!
    end

    def label_type
      nil
    end

  end

  class PlatePresenter
    include Presenter
    include PlateWalking

    write_inheritable_attribute :attributes, [ :api, :plate ]

    class_inheritable_reader    :aliquot_partial
    write_inheritable_attribute :aliquot_partial, 'lab_ware/aliquot'

    class_inheritable_reader    :summary_partial
    write_inheritable_attribute :summary_partial, 'lab_ware/plates/standard_summary'

    class_inheritable_reader    :additional_creation_partial
    write_inheritable_attribute :additional_creation_partial, 'lab_ware/plates/child_plate_creation'

    class_inheritable_reader :printing_partial

    class_inheritable_reader    :tab_views
    write_inheritable_attribute :tab_views, {
      'summary-button'        => ['plate-summary', 'plate-printing' ],
      'plate-creation-button' => [ 'plate-summary', 'plate-creation' ],
      'plate-QC-button'       => [ 'plate-summary', 'plate-creation' ],
      'plate-state-button'    => [ 'plate-summary', 'plate-state' ],
      'well-failing-button'   => [ 'well-failing' ]
    }

    class_inheritable_reader    :tab_states
    write_inheritable_attribute :tab_states, {
      :pending      =>  ['summary-button'],
      :started      =>  ['summary-button'],
      :passed       =>  ['summary-button'],
      :cancelled    =>  ['summary-button'],
      :qc_complete  =>  ['summary-button'],
      :nx_in_progress => ['summary-button']
    }

    class_inheritable_reader    :authenticated_tab_states
    write_inheritable_attribute :authenticated_tab_states, {
        :pending    =>  [ 'summary-button', 'plate-state-button' ],
        :started    =>  [ 'plate-state-button', 'summary-button' ],
        :passed     =>  [ 'plate-creation-button','summary-button', 'well-failing-button', 'plate-state-button' ],
        :cancelled  =>  [ 'summary-button' ],
        :failed     =>  [ 'summary-button' ]
    }


    def label_type
      yield "custom-labels"
    end

    def plate_to_walk
      self.plate
    end

    def lab_ware
      @labware ||= self.plate
    end

    def purpose
      @purpose ||= lab_ware.plate_purpose
    end

    def qc_owner
      lab_ware
    end

    def control_worksheet_printing(&block)
      yield
      nil
    end

    def lab_ware_form_details(view)
      { :url => view.pulldown_plate_path(self.plate), :as  => :plate }
    end

    def transfers
      transfers = self.plate.creation_transfer.transfers
      transfers.sort {|a,b| split_location(a.first) <=> split_location(b.first) }
    end

    # Split a location string into an array containing the row letter
    # and the column number (as a integer) so that they can be sorted.
    def split_location(location_string)
      match = location_string.match(/^([A-H])(\d+)/)
      [ match[2].to_i, match[1] ]  # Order by column first
    end
    private :split_location

    class UnknownPlateType < StandardError
      attr_reader :plate

      def initialize(plate)
        super("Unknown plate type #{plate.plate_purpose.name.inspect}")
        @plate = plate
      end
    end

    def self.lookup_for(plate)
      plate_details = Settings.purposes[plate.plate_purpose.uuid] or raise UnknownPlateType, plate
      plate_details[:presenter_class].constantize
    end

    def csv_file_links
      [["","#{Rails.application.routes.url_helpers.pulldown_plate_path(plate.uuid)}.csv"]]
    end

    def filename
      false
    end
  end
end
