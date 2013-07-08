module Presenters
  class QcPlatePresenter < StandardPresenter

    write_inheritable_attribute :has_qc_data?, true

    def qc_owner
      labware.creation_transfers.first.source
    end

  end
end
