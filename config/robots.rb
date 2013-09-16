BED = ['5800000007932', '5800000018068', '5800000028104', '5800000038240', '5800000048386', '5800000058422', '5800000068568', '5800000078604', '5800000088740', '5800000096592', '5800000108158', '5800000118294', '5800000128330']
CAR = {
  :c13 => '5800000138476',
  :c23 => '5800000238602',
  :c43 => '5800000436770'
}

ROBOT_CONFIG = {
  'nx8-pre-cap-pool' => {
    :name   => 'NX8 Lib PCR-XP to ISCH Lib Pool',
    :layout => 'bed',
    :beds   => {
      BED[2]  => {:purpose => 'Lib PCR-XP', :states => ['qc_complete'], :child=>BED[5]},
      BED[6]  => {:purpose => 'Lib PCR-XP', :states => ['qc_complete'], :child=>BED[5]},
      BED[3]  => {:purpose => 'Lib PCR-XP', :states => ['qc_complete'], :child=>BED[5]},
      BED[7]  => {:purpose => 'Lib PCR-XP', :states => ['qc_complete'], :child=>BED[5]},
      BED[5]  => {
        :purpose => 'ISCH lib pool',
        :states => ['pending','started'],
        :parents =>[BED[2],BED[6],BED[3],BED[7],BED[2],BED[6],BED[3],BED[7]],
        :target_state => 'nx_in_progress'
      }
    },
    :destination_bed => BED[5],
    :class => 'Robots::PoolingRobot'
  },
  'nx8-pre-hyb-pool' => {
    :name   => 'NX8 ISCH Lib Pool to Hyb',
    :layout => 'bed',
    :beds   => {
      BED[5]  => {:purpose => 'ISCH lib pool', :states => ['passed'], :child=>BED[6]},
      BED[6]  => {
        :purpose => 'ISCH hyb',
        :states => ['pending'],
        :parents =>[BED[5]],
        :target_state => 'started'
      }
    }
  },
  'bravo-cap-wash' => {
    :name   => 'Bravo ISCH hyb to ISCH cap lib',
    :layout => 'bed',
    :beds   => {
      BED[4]  => {:purpose => 'ISCH hyb', :states => ['passed'], :child=>CAR[:c13]},
      CAR[:c13]  => {
        :purpose => 'ISCH cap lib',
        :states => ['pending'],
        :parents =>[BED[4]],
        :target_state => 'started'
      }
    }
  },
  'bravo-post-cap-pcr-setup' => {
    :name   => 'Bravo ISCH cap lib to ISCH cap lib PCR',
    :layout => 'bed',
    :beds   => {
      BED[4]  => {:purpose => 'ISCH cap lib', :states => ['passed'], :child=>BED[5]},
      BED[5]  => {
        :purpose => 'ISCH cap lib PCR',
        :states => ['pending'],
        :parents =>[BED[4]],
        :target_state => 'started'
      }
    }
  },
  'bravo-post-cap-pcr-cleanup' => {
    :name   => 'Bravo ISCH cap lib PCR to ISCH cap lib PCR-XP',
    :layout => 'bed',
    :beds   => {
      BED[4]  => {:purpose => 'ISCH cap lib PCR', :states => ['passed'], :child=>CAR[:c23]},
      CAR[:c23]  => {
        :purpose => 'ISCH cap lib PCR-XP',
        :states => ['pending'],
        :parents =>[BED[4]],
        :target_state => 'started'
      }
    }
  },
  'nx8-post-cap-lib-pool' => {
    :name   => 'NX8 ISCH cap lib PCR-XP to ISCH cap lib pool',
    :layout => 'bed',
    :beds   => {
      BED[1]  => {:purpose => 'ISCH cap lib PCR-XP', :states => ['passed'], :child=>BED[9]},
      BED[9]  => {
        :purpose => 'ISCH cap lib pool',
        :states => ['pending'],
        :parents =>[BED[1]],
        :target_state => 'started'
      }
    }
  }
}
