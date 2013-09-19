module Presenters
  class QCPlatePresenter < StandardPresenter

    write_inheritable_attribute :has_qc_data?, true

    def qc_owner
      lab_ware.creation_transfers.first.source
    end

  end
end
