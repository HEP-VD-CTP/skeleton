import fr from './fr'

export default {
  'fr': fr
}

export type TranslationSchema = {
  login_page: {
    connect_with_local_account: string,
    login_button: string
    logout_button: string,
    login_page_title: string,
    invalid: string,
    sessionExpired: string
  },
  misc: {
    alert: string,
    appearance: string,
    cancel: string, 
    close: string,
    delete: string, 
    error: string,
    language: string,
    settings: string,
    created_at: string,
    create: string, 
    description: string,
    wrong_input: string,
    error_message: string,
    load_more: string,
    modify: string,
    about: string,
    minimize_drawer: string,
  },
  user: {
    firstname: string, 
    lastname: string, 
    email: string, 
    password: string,
    user_account: string,
    change_password: string,
    users: string
  },
  users: {
    active: string,
    admin_role: {
      title: string,
      description: string
    },
    archived_role: {
      title: string,
      description: string
    },
    blocked_role: {
      title: string, 
      description: string
    },
    delete: {
      title: string,
      message: string
    },
    user_added: string,
    user_removed: string,
    active_account_exists: string, 
    unarchivable: string,
    user_details: string,
    stats: string, 
    total: string, 
    archived: string,
    blocked: string,
    instructions: string, 
    add_user: string, 
    add_users: string,
    search_user: string,
    users: string,
    use_filter: string,
    no_results: string,
    saved: string,
    saving: string,
    teacher_role: {
      title: string,
      description: string
    },
    roles: string,
    status: string,
    identity: string,
    member_since: string,
    files: string,
    disk_usage: string,
    no_files: string,
    total_size: string,
  },
  home: {
    welcome: string,
    my_files: string,
    upload: string,
    no_files: string,
    delete_confirm: string,
    download: string,
    filename: string,
    size: string,
    uploaded: string,
  },
  validation: {
    name: {
      mandatory: string,
      maxLength: string
    },
    email: {
      mandatory: string,
      maxLength: string,
      valid: string
    },
    password: {
      mandatory: string,
      length: string,
    },
    description: {
      mandatory: string,
      maxLength: string
    }

  }
}