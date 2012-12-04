module PlateHelper
  class WellFailingPresenter < BasicObject
    def initialize(form, presenter)
      @form, @presenter = form, presenter
    end

    def respond_to?(name, include_private = false)
      super or @presenter.respond_to?(name, include_private)
    end

    def method_missing(name, *args, &block)
      @presenter.send(name, *args, &block)
    end
    protected :method_missing

    def aliquot_partial
      'well_failing_aliquot'
    end

    def form
      @form
    end
  end

  def fail_wells_presenter_from(form, presenter)
    WellFailingPresenter.new(form, presenter)
  end

  def sortable_well_location_for(location)
    match = location.match(/^([A-Z])(\d+)$/)
    [match[1],match[2].to_i]
  end
  private :sortable_well_location_for

  def sorted_sequencing_pool_json
    failed_wells = @creation_form.plate.wells.select {|w| w.state == 'failed' }.map(&:location)

    # Reorder pools to column major order & eliminate failed wells from pool
    sorted_pool_array = @creation_form.plate.pools.map do |pool_id,pool|
      [pool_id,pool].tap do
        pool['failures']  = pool['wells'] & failed_wells
        pool['all_wells'] = pool['wells'].sort_by(&Pulldown::PooledPlate::WELLS_IN_COLUMN_MAJOR_ORDER.method(:find_index))
        pool['wells']     = pool['all_wells'] - pool['failures']
      end
    end.sort_by do |(_,pool)|
      sortable_well_location_for(pool['wells'].first)
    end

    Hash[sorted_pool_array].to_json.html_safe
  end
end
