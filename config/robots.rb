BED = ['580000000793', '580000001806', '580000002810', '580000003824', '580000004838', '580000005842', '580000006856', '580000007860', '580000008874', '580000009659', '580000010815', '580000011829', '580000012833']
CAR = {
  :c13 => '580000013847',
  :c23 => '580000023860',
  :c43 => '580000043677'
}

ROBOT_CONFIG = {
  'nx8-pre-cap-pool' => {
    :name   => 'NX8 Lib PCR-XP to ISC-HTP Lib Pool',
    :layout => 'bed',
    :beds   => {
      BED[1]  => {:purpose => 'Lib PCR-XP', :states => ['qc_complete'], :child=>BED[5]},
      BED[2]  => {:purpose => 'Lib PCR-XP', :states => ['qc_complete'], :child=>BED[5]},
      BED[3]  => {:purpose => 'Lib PCR-XP', :states => ['qc_complete'], :child=>BED[5]},
      BED[4]  => {:purpose => 'Lib PCR-XP', :states => ['qc_complete'], :child=>BED[5]},
      BED[5]  => {
        :purpose => 'ISC-HTP lib pool',
        :states => ['pending','started'],
        :parents =>[BED[1],BED[2],BED[3],BED[4],BED[1],BED[2],BED[3],BED[4]],
        :target_state => 'nx_in_progress'
      }
    },
    :destination_bed => BED[5],
    :class => 'Robots::PoolingRobot'
  },
  'nx8-pre-hyb-pool' => {
    :name   => 'NX8 ISC-HTP Lib Pool to Hyb',
    :layout => 'bed',
    :beds   => {
      BED[1]  => {:purpose => 'ISC-HTP lib pool', :states => ['passed'], :child=>BED[9]},
      BED[9]  => {
        :purpose => 'ISC-HTP hyb',
        :states => ['pending'],
        :parents =>[BED[1]],
        :target_state => 'started'
      }
    }
  },
  'bravo-cap-wash' => {
    :name   => 'Bravo ISC-HTP hyb to ISC-HTP cap lib',
    :layout => 'bed',
    :beds   => {
      BED[4]  => {:purpose => 'ISC-HTP hyb', :states => ['passed'], :child=>CAR[:c13]},
      CAR[:c13]  => {
        :purpose => 'ISC-HTP cap lib',
        :states => ['pending'],
        :parents =>[BED[4]],
        :target_state => 'started'
      }
    }
  },
  'bravo-post-cap-pcr-setup' => {
    :name   => 'Bravo ISC-HTP cap lib to ISC-HTP cap lib PCR',
    :layout => 'bed',
    :beds   => {
      BED[4]  => {:purpose => 'ISC-HTP cap lib', :states => ['passed'], :child=>BED[5]},
      BED[5]  => {
        :purpose => 'ISC-HTP cap lib PCR',
        :states => ['pending'],
        :parents =>[BED[4]],
        :target_state => 'started'
      }
    }
  },
  'bravo-post-cap-pcr-cleanup' => {
    :name   => 'Bravo ISC-HTP cap lib PCR to ISC-HTP cap lib PCR-XP',
    :layout => 'bed',
    :beds   => {
      BED[4]  => {:purpose => 'ISC-HTP cap lib PCR', :states => ['passed'], :child=>CAR[:c23]},
      CAR[:c23]  => {
        :purpose => 'ISC-HTP cap lib PCR-XP',
        :states => ['pending'],
        :parents =>[BED[4]],
        :target_state => 'started'
      }
    }
  },
  'nx8-post-cap-lib-pool' => {
    :name   => 'NX8 ISC-HTP cap lib PCR-XP to ISC-HTP cap lib pool',
    :layout => 'bed',
    :beds   => {
      BED[1]  => {:purpose => 'ISC-HTP cap lib PCR-XP', :states => ['passed'], :child=>BED[9]},
      BED[9]  => {
        :purpose => 'ISC-HTP cap lib pool',
        :states => ['pending'],
        :parents =>[BED[1]],
        :target_state => 'started'
      }
    }
  }
}
