class PlateCreationController < CreationController
  write_inheritable_attribute :creation_message, 'New empty plate added to system.'

  def form_lookup(form_attributes = params)
    Settings.purposes[form_attributes[:plate_purpose_uuid]][:form_class].constantize
  end

  def redirection_path(form)
    pulldown_plate_path(form.child.uuid)
  end
end
