namespace :config do
  desc 'Generates a configuration file for the current Rails environment'

  require "#{Rails.root}/config/robots.rb"

  task :generate => :environment do
    api = Sequencescape::Api.new(PulldownPipeline::Application.config.api_connection_options)

    # Build the configuration file based on the server we are connected to.
    configuration = {}

    configuration[:searches] = {}.tap do |searches|
      puts "Preparing searches ..."

      api.search.all.each do |search|
        searches[search.name] = search.uuid
      end
    end

    configuration[:transfer_templates] = {}.tap do |transfer_templates|
      puts "Preparing transfer templates ..."

      api.transfer_template.all.each do |transfer_template|
        transfer_templates[transfer_template.name] = transfer_template.uuid
      end
    end

    barcode_printer_uuid = lambda do |printers|
      ->(printer_name){
        printers.detect { |prt| prt.name == printer_name}.try(:uuid) or
        raise "Printer #{printer_name}: not found!"
      }
    end.(api.barcode_printer.all)

    configuration[:printers] = {}.tap do |printers|
      printers[:plate_a] = barcode_printer_uuid.('g316bc')
      printers[:plate_b] = barcode_printer_uuid.('g317bc')
      printers[:tube]    = barcode_printer_uuid.('g314bc')
      printers['limit'] = 5
      printers['default_count'] = 2
    end

    configuration[:purposes] = {}.tap do |plate_purposes|
      # Setup a hash that will enable us to lookup the form, presenter, and state changing classes
      # based on the name of the plate purpose.  We can then use that to generate the information for
      # the mapping from UUID.
      #
      # The inner block is laid out so that the class names align, not so it's readable!
      name_to_details = Hash.new do |h,k|
        h[k] = {
          :form_class           => 'Forms::CreationForm',
          :presenter_class      => 'Presenters::StandardPresenter',
          :state_changer_class  => 'StateChangers::DefaultStateChanger',
          :default_printer_type => :plate_a
        }
      end.tap do |presenters|
        # WGS plates
        presenters["WGS stock DNA"].merge!(   :presenter_class => "Presenters::StockPlatePresenter")
        presenters["WGS post-Cov"].merge!(    :presenter_class => "Presenters::QcCapablePlatePresenter")
        presenters["WGS post-Cov-XP"].merge!( :presenter_class => "Presenters::QcCapablePlatePresenter")

        presenters["WGS lib"].merge!(                 :form_class => "Forms::TransferForm")
        presenters["WGS lib PCR"].merge!(             :form_class => "Forms::TaggingForm",       :presenter_class => "Presenters::TaggedPresenter")
        presenters["WGS lib PCR-XP"].merge!( :presenter_class => "Presenters::QcCapablePlatePresenter", :default_printer_type => :plate_b)
        presenters["WGS lib pool"].merge!(:form_class => "Forms::AutoPoolingForm",   :presenter_class => "Presenters::FinalPooledPresenter",  :state_changer_class => 'StateChangers::AutoPoolingStateChanger', :default_printer_type => :plate_b)

        # SC plates
        presenters["SC stock DNA"].merge!(                                                               :presenter_class => "Presenters::StockPlatePresenter")
        presenters["SC lib"].merge!(                  :form_class => "Forms::TransferForm")
        presenters["SC cap lib PCR"].merge!(     :form_class => "Forms::TaggingForm",       :presenter_class => "Presenters::TaggedPresenter")
        presenters["SC hyb"].merge!(            :form_class => "Forms::BaitingForm",       :presenter_class => "Presenters::BaitedPresenter", :default_printer_type => :plate_b)
        presenters["SC cap lib pool"].merge!(  :form_class => "Forms::AutoPoolingForm",   :presenter_class => "Presenters::FinalPooledPresenter",  :state_changer_class => 'StateChangers::AutoPoolingStateChanger', :default_printer_type => :plate_b)

        # ISC plates
        presenters["ISC stock DNA"].merge!(                                                              :presenter_class => "Presenters::StockPlatePresenter")
        presenters["ISC lib"].merge!(                 :form_class => "Forms::TransferForm")
        presenters["ISC lib PCR"].merge!(             :form_class => "Forms::TaggingForm",       :presenter_class => "Presenters::TaggedPresenter")
        presenters["ISC lib pool"].merge!(:form_class => "Forms::CustomPoolingForm", :presenter_class => "Presenters::CustomPooledPresenter", :default_printer_type => :plate_b)
        presenters["ISC hyb"].merge!(           :form_class => "Forms::BaitingForm",       :presenter_class => "Presenters::BaitedPresenter", :default_printer_type => :plate_b)
        presenters["ISC cap lib pool"].merge!( :form_class => "Forms::AutoPoolingForm",   :presenter_class => "Presenters::FinalPooledPresenter",  :state_changer_class => 'StateChangers::AutoPoolingStateChanger', :default_printer_type => :plate_b)

        # ISC-HTP plates
        presenters["Lib PCR-XP"].merge!( :presenter_class => "Presenters::LibPcrXpPresenter", :selected_child_purpose => "ISC-HTP lib pool")
        presenters["ISC-HTP lib pool"].merge!(:form_class => "Forms::MultiPlatePoolingForm", :presenter_class => "Presenters::MultiPlatePooledPresenter", :default_printer_type => :plate_b)
        presenters["ISC-HTP hyb"].merge!(           :form_class => "Forms::BaitingForm",       :presenter_class => 'Presenters::StandardRobotPresenter', :robot=>'nx8-pre-hyb-pool', :default_printer_type => :plate_b)
        presenters['ISC-HTP cap lib'].merge!( :presenter_class => 'Presenters::StandardRobotPresenter', :robot=>'bravo-cap-wash', :default_printer_type => :plate_b)
        presenters['ISC-HTP cap lib PCR'].merge!(:presenter_class => 'Presenters::StandardRobotPresenter', :robot=>'bravo-post-cap-pcr-setup', :default_printer_type => :plate_b)
        presenters['ISC-HTP cap lib PCR-XP'].merge!(:presenter_class => 'Presenters::StandardRobotPresenter', :robot=>'bravo-post-cap-pcr-cleanup', :default_printer_type => :plate_b)
        presenters["ISC-HTP cap lib pool"].merge!( :form_class => "Forms::AutoPoolingForm",   :presenter_class => "Presenters::FinalPooledRobotPresenter",  :state_changer_class => 'StateChangers::AutoPoolingStateChanger', :default_printer_type => :plate_b)


        presenters["Pulldown QC plate"].merge!(   :presenter_class => "Presenters::QCPlatePresenter")
      end

      puts "Preparing plate purpose forms, presenters, and state changers ..."

      configuration[:purpose_uuids] = {}

      api.plate_purpose.all.each do |plate_purpose|
        next unless plate_purpose.name == 'Pulldown QC plate' or plate_purpose.name =~ /^(WGS|SC|ISC|ISC-HTP)\s/ or plate_purpose.name == 'Lib PCR-XP' # Ignore unnecessary plates
        plate_purposes[plate_purpose.uuid] = name_to_details[plate_purpose.name].dup.merge(
          :name => plate_purpose.name
        )
        configuration[:purpose_uuids][plate_purpose.name] = plate_purpose.uuid
      end

      configuration[:robots] = ROBOT_CONFIG

    end

    # Write out the current environment configuration file
    File.open(File.join(Rails.root, %w{config settings}, "#{Rails.env}.yml"), 'w') do |file|
      file.puts(configuration.to_yaml)
    end
  end

  task :default => :generate
end
