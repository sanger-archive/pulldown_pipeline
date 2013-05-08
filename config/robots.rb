ROBOT_CONFIG = {
  'nx8' => {
    :name   => 'nx8',
    :layout => 'bed',
    :beds   => {
      '5800000018068'  => {:purpose => 'Lib PCR-XP', :states => ['qc_complete'], :child=>'5800000058422'},
      '5800000028104'  => {:purpose => 'Lib PCR-XP', :states => ['qc_complete'], :child=>'5800000058422'},
      '5800000038240'  => {:purpose => 'Lib PCR-XP', :states => ['qc_complete'], :child=>'5800000058422'},
      '5800000048386'  => {:purpose => 'Lib PCR-XP', :states => ['qc_complete'], :child=>'5800000058422'},
      '5800000058422'  => {
        :purpose => 'ISC-HTP lib pool',
        :states => ['pending','started'],
        :parents =>['5800000018068','5800000028104','5800000038240','5800000048386','5800000018068','5800000028104','5800000038240','5800000048386'],
        :target_state => 'nx_in_progress'
      }
    },
    :destination_bed => '5800000058422',
    :class => 'Robots::PoolingRobot'
  }
}
