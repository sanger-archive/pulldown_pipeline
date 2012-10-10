module Forms
  class CustomPoolingForm < CreationForm
    include Forms::Form::CustomPage

    write_inheritable_attribute :page, 'custom_pooling'
    write_inheritable_attribute :aliquot_partial, "custom_pooled_aliquot"

    write_inheritable_attribute :default_transfer_template_uuid,
      Settings.transfer_templates['Pool wells based on submission']

    write_inheritable_attribute :attributes, [:api, :plate_purpose_uuid, :parent_uuid, :user_uuid, :transfers]

    write_inheritable_attribute :tab_views, {
      'master-settings' => [
        'master-plex-level-block', 'input-plate-block',
                                   'output-plate-block'
      ],

      'edit-pool' => [
        'edit-pool-instruction-block', 'input-plate-block',
                    'edit-pool-block', 'output-plate-block'
      ],

      'move-pools' => [
        'move-pools-instruction-block', 'input-plate-block',
                    'move-pools-block', 'output-plate-block'
      ],

      'pooling-summary' => [
        'pooling-summary-block', 'input-plate-block',
           'create-plate-block', 'output-plate-block'
      ]
    }


    def create_objects!(selected_transfer_template_uuid = default_transfer_template_uuid, &block)
      @plate_creation = api.plate_creation.create!(
        :parent        => parent_uuid,
        :child_purpose => plate_purpose_uuid,
        :user          => user_uuid
      )


      api.transfer_template.find(Settings.transfer_templates['Custom pooling']).create!(
        :source      => parent_uuid,
        :destination => @plate_creation.child.uuid,
        :user        => user_uuid,
        :transfers   => transfers.reject { |from_well,to_well| to_well.blank? }
      )

      yield(@plate_creation.child) if block_given?
      true
    end
    private :create_objects!
  end
end

