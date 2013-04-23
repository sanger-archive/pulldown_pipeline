class Presenters::MultiPlatePooledPresenter < Presenters::PooledPresenter
  write_inheritable_attribute :summary_partial, 'lab_ware/plates/multi_pooled_plate'
  write_inheritable_attribute :printing_partial, 'lab_ware/plates/tube_printing'

  write_inheritable_attribute :csv, 'show_pooled'

  state_machine :pooled_state, :initial => :pending, :namespace => 'pooled' do
    Presenters::Statemachine::StateTransitions.inject(self)

    state :pending do

    end
    state :started do

    end
    state :passed do
      def control_source_view(&block)
        yield
        nil
      end
    end
    state :failed do

    end
    state :cancelled do

    end
  end

  def transfers
    self.plate.creation_transfers.map do |ct|
      ct.transfers.sort {|a,b| split_location(a.first) <=> split_location(b.first) }
    end
  end

  def pooled_state
    plate.state
  end

  def pooled_state=(state)
    # Ignore this
  end
end
