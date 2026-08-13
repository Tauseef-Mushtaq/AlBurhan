export interface Dictionary {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    journey: string;
    practice: string;
    progress: string;
    login: string;
    getStarted: string;
    menu: string;
    dashboard: string;
    logout: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cta: string;
    scroll: string;
  };
  sections: {
    theDay: {
      label: string;
      title: string;
      body: string;
    };
    salah: {
      label: string;
      title: string;
      body: string;
      names: {
        fajr: string;
        zuhr: string;
        asr: string;
        maghrib: string;
        isha: string;
      };
    };
    quran: {
      label: string;
      title: string;
      body: string;
    };
    dhikr: {
      label: string;
      title: string;
      body: string;
    };
    character: {
      label: string;
      title: string;
      body: string;
      pillars: {
        gaze: string;
        tongue: string;
        ears: string;
      };
    };
    progress: {
      label: string;
      title: string;
      body: string;
      steps: {
        day: string;
        week: string;
        month: string;
        journey: string;
      };
    };
  };
  finalCta: {
    title: string;
    subtitle: string;
    cta: string;
  };
  footer: {
    tagline: string;
    rights: string;
  };
  auth: {
    login: {
      title: string;
      subtitle: string;
      email: string;
      password: string;
      submit: string;
      switchPrompt: string;
      switchCta: string;
    };
    signup: {
      title: string;
      subtitle: string;
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
      submit: string;
      switchPrompt: string;
      switchCta: string;
    };
  };
  dashboard: {
    nav: {
      today: string;
      progress: string;
      history: string;
      settings: string;
      logout: string;
      adminPanel: string;
      home: string;
    };
    greeting: string;
    todaysPractice: string;
    completion: string;
    dayScore: string;
    todayProgress: string;
    categories: {
      faraid: string;
      nawafil: string;
      quran: string;
      morningAzkar: string;
      eveningAzkar: string;
      selfControl: string;
    };
    status: {
      completed: string;
      notCompleted: string;
    };
    demoNotice: string;
    emptyCategories: string;
    counterError: string;
    increment: string;
    decrement: string;
    enterValue: string;
    complete: string;
    prayer: {
      congregation: string;
      individual: string;
      missed: string;
    };
  };
  progressPage: {
    title: string;
    today: string;
    weeklyTrend: string;
    monthlyTrend: string;
    categoryBreakdown: string;
    streak: string;
    streakUnit: string;
    noStreak: string;
    loadError: string;
  };
  historyPage: {
    title: string;
    previousDay: string;
    nextDay: string;
    todayLink: string;
    dayScore: string;
    allPractices: string;
    noRecords: string;
    loadError: string;
    futureDateBlocked: string;
  };
  settingsPage: {
    title: string;
    profileSection: string;
    name: string;
    namePlaceholder: string;
    languageSection: string;
    timezoneSection: string;
    save: string;
    saved: string;
    error: string;
  };
  admin: {
    nav: {
      overview: string;
      users: string;
      activity: string;
      analytics: string;
      reports: string;
      backToDashboard: string;
      home: string;
      logout: string;
    };
    overview: {
      title: string;
      totalUsers: string;
      activeToday: string;
      activeThisWeek: string;
      avgCompletion: string;
      avgScore: string;
      practicesCompletedToday: string;
      dailyActivity: string;
      practiceBreakdown: string;
      demoNotice: string;
    };
    users: {
      title: string;
      searchPlaceholder: string;
      name: string;
      email: string;
      role: string;
      timezone: string;
      joined: string;
      lastActivity: string;
      never: string;
      noResults: string;
      viewDetail: string;
      previous: string;
      next: string;
      pageOf: string;
    };
    userDetail: {
      title: string;
      backToUsers: string;
      profile: string;
      progress: string;
      currentStreak: string;
      avgDayScore: string;
      last7Days: string;
      last30Days: string;
      completionToday: string;
      categoryPerformance: string;
      recentActivity: string;
      recentDayScores: string;
      noActivity: string;
      notFound: string;
    };
    activity: {
      title: string;
      empty: string;
      completed: string;
      uncompleted: string;
      newUser: string;
    };
    analytics: {
      title: string;
      userGrowth: string;
      practiceActivity: string;
      dayScoreTrend: string;
      categoryCompletion: string;
      last7: string;
      last30: string;
    };
    reports: {
      title: string;
      startDate: string;
      endDate: string;
      generate: string;
      downloadCsv: string;
      totalUsers: string;
      activeUsers: string;
      practiceCompletions: string;
      avgDayScore: string;
      categoryCompletion: string;
    };
    roles: {
      admin: string;
      user: string;
    };
  };
  common: {
    comingSoon: string;
    demo: string;
    language: string;
    loading: string;
  };
  errors: {
    genericTitle: string;
    genericBody: string;
    retry: string;
    goHome: string;
    goDashboard: string;
    notFoundTitle: string;
    notFoundBody: string;
  };
  reports: {
    download: string;
    modalTitle: string;
    pdf: string;
    image: string;
    csv: string;
    csvFull: string;
    cancel: string;
    generating: string;
    error: string;
    dailyReportTitle: string;
    rangeReportTitle: string;
    generatedOn: string;
    from: string;
    to: string;
    generate: string;
    bestDay: string;
    lowestDay: string;
    dailyTrend: string;
    fullHistory: string;
    downloadHistory: string;
    noRecordForDate: string;
    historyTable: {
      title: string;
      date: string;
      dayScore: string;
      completed: string;
      status: string;
      excellent: string;
      good: string;
      needsImprovement: string;
      noRecords: string;
    };
  };
}
