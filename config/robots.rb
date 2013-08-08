BED = ['5800000007932', '5800000018068', '5800000028104', '5800000038240', '5800000048386', '5800000058422', '5800000068568', '5800000078604', '5800000088740', '5800000096592', '5800000108158', '5800000118294', '5800000128330']
CAR = {
  :c13 => '5800000138476',
  :c23 => '5800000238602',
  :c43 => '5800000436770'
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
