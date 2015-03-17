module SearchHelper
  def search_status(search_results)
    if search_results.present?
      'Search Results'
    else
      'No plates found.'
    end
  end

  def shared_app
    PulldownPipeline::Application.config.shared_app_path
  end
end

