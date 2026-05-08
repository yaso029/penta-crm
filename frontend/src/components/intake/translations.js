export const T = {
  en: {
    back: '← Back',
    next: 'Continue →',
    yes: 'Yes', no: 'No',
    step: (s, t) => `Step ${s} of ${t}`,
    reviewStep: '✓ Review & Confirm',
    restart: '✕ Restart',

    welcome: {
      company: 'Penta Real Estate',
      subtitle: 'Dubai Property Advisor',
      heading: "Let's find your perfect property",
      body: "Answer a few questions and our AI will match you with the best properties in Dubai. Takes about 3 minutes.",
      start: 'Start →',
      secure: 'Secure & Private', time: '3 Minutes', free: 'Free Consultation',
    },

    thankYou: {
      title: (name) => `Thank You, ${name}!`,
      body: 'Your request is now in the queue for our AI to scan and search for the best property options for you. We will share the full report with you very soon.',
    },

    purpose: {
      title: "What's your purchase purpose?",
      subtitle: 'This helps us recommend the right type of property and communities for you.',
      investment: 'Investment', investmentDesc: 'Buy to earn rental income or capital growth',
      endUser: 'Personal Use', endUserDesc: 'Buy to live in the property yourself',
      goalLabel: "What's your investment goal?",
      rentalYield: 'Rental Yield', rentalYieldDesc: 'Steady monthly rental income',
      capital: 'Capital Appreciation', capitalDesc: 'Buy now, sell higher later',
      both: 'Both', bothDesc: 'Rental income + long-term growth',
      residenceLabel: 'What type of residence?',
      primary: 'Primary Residence', primaryDesc: 'My main home in Dubai',
      holiday: 'Holiday Home', holidayDesc: 'Use occasionally, rent when away',
    },

    propertyType: {
      title: 'What type of property?', subtitle: 'You can select more than one option.',
      apartment: 'Apartment', apartmentDesc: 'Unit in a residential tower',
      villa: 'Villa', villaDesc: 'Standalone home with garden',
      townhouse: 'Townhouse', townhouseDesc: 'Multi-floor row home',
      penthouse: 'Penthouse', penthouseDesc: 'Top-floor luxury unit',
    },

    bedrooms: {
      title: 'How many bedrooms?', subtitle: 'Select the size that best fits your needs.',
    },

    areas: {
      title: 'Preferred areas in Dubai',
      subtitle: "Select all communities you're interested in. You can choose multiple.",
      selected: (n) => `${n} area${n > 1 ? 's' : ''} selected`,
    },

    market: {
      title: 'Off-plan or ready market?', subtitle: "This determines which listings and developers we'll show you.",
      offplan: 'Off-Plan', offplanDesc: 'Buy direct from developer. Flexible payment plans. Lower entry price.',
      ready: 'Ready / Secondary', readyDesc: 'Move in immediately. Established communities. Full transparency.',
      both: 'Open to Both', bothDesc: "Show me all options — I want to compare and decide.",
    },

    budget: {
      title: "What's your budget?", subtitle: 'Set your minimum and maximum to help us filter the best options.',
      rangeLabel: 'Selected Budget Range', quickSelect: 'Quick select:',
    },

    payment: {
      title: 'How will you finance the purchase?', subtitle: 'This helps us show you the most suitable payment options.',
      cash: 'Cash Buyer', cashDesc: 'Full payment upfront',
      mortgage: 'Mortgage', mortgageDesc: 'Bank financed purchase',
      paymentPlan: 'Developer Payment Plan', paymentPlanDesc: 'Off-plan installment plan',
      unsure: 'Not Sure Yet', unsureDesc: "I'd like to explore my options",
      employmentLabel: 'Employment status',
      employed: 'Employed', selfEmployed: 'Self-Employed', businessOwner: 'Business Owner', investor: 'Investor / Retired',
      incomeLabel: 'Monthly salary / income (AED)', incomePlaceholder: 'e.g. 35,000',
      liabilitiesLabel: 'Existing monthly liabilities (AED) — car loans, credit cards, other loans',
      liabilitiesPlaceholder: 'e.g. 5,000 — enter 0 if none',
      preapprovedLabel: 'Are you already pre-approved for a mortgage?',
      preapprovalAmountLabel: 'Pre-approval amount (AED)', preapprovalAmountPlaceholder: 'e.g. 2,500,000',
      downPaymentLabel: 'Down payment available',
    },

    features: {
      title: 'Must-have features', subtitle: 'Select all features that are important to you.',
      pool: 'Swimming Pool', gym: 'Gym / Fitness', parking: 'Covered Parking',
      seaView: 'Sea / Water View', burjView: 'Burj Khalifa View', garden: 'Garden / Outdoor',
      maidsRoom: "Maid's Room", wardrobes: 'Built-in Wardrobes', balcony: 'Balcony / Terrace',
      petFriendly: 'Pet Friendly', kidsPlay: 'Kids Play Area', smartHome: 'Smart Home', security: '24hr Security',
      selected: (n) => `${n} feature${n > 1 ? 's' : ''} selected`,
    },

    timeline: {
      title: 'When are you looking to buy?', subtitle: 'This helps us prioritise the right options and developers for you.',
      immediate: '⚡ Immediately', immediateSub: 'Within 1 month',
      threeMonths: '📅 Within 3 Months', threeMonthsSub: 'Ready to move fast',
      sixMonths: '🗓️ Within 6 Months', sixMonthsSub: 'Taking my time',
      oneYear: '📆 Within 1 Year', oneYearSub: 'Still researching',
      exploring: '🔍 Just Exploring', exploringSub: 'No fixed timeline yet',
      viewedLabel: 'Have you viewed properties already?',
      brokersLabel: 'Are you working with other brokers?',
    },

    notes: {
      title: 'Anything else we should know?',
      subtitle: 'Add any specific requirements, preferences, or questions for our team.',
      placeholder: 'e.g. Close to a specific school, near the metro, high floor preference, specific developer in mind, investment for my kids, relocating from London in September...',
      optional: 'Optional — you can skip this step',
      nextLabel: 'Review My Answers →',
    },

    contact: {
      title: 'Almost done — your contact details',
      subtitle: "We'll use these to send your personalised property report and get in touch.",
      nameLabel: 'Full Name', namePlaceholder: 'e.g. Ahmed Al Mansouri',
      whatsappLabel: 'WhatsApp Number', emailLabel: 'Email Address',
      nationalityLabel: 'Nationality', nationalityPlaceholder: 'Select your nationality',
      inDubaiLabel: 'Are you currently based in Dubai?',
    },

    review: {
      heading: 'Review Your Answers',
      subheading: "Everything looks good? Submit and we'll be in touch shortly.",
      edit: 'Edit',
      purchasePurpose: 'Purchase Purpose', propertyRequirements: 'Property Requirements',
      budget: 'Budget', paymentMethod: 'Payment Method', mustHaveFeatures: 'Must-Have Features',
      timeline: 'Timeline', additionalNotes: 'Additional Notes', contactDetails: 'Contact Details',
      purpose: 'Purpose', investmentGoal: 'Investment Goal', residenceType: 'Residence Type',
      propertyTypes: 'Property Types', bedrooms: 'Bedrooms', preferredAreas: 'Preferred Areas',
      market: 'Market', budgetRange: 'Budget Range', payment: 'Payment',
      employmentStatus: 'Employment Status', monthlyIncome: 'Monthly Income',
      monthlyLiabilities: 'Monthly Liabilities', preapproved: 'Pre-approved',
      preapprovalAmount: 'Pre-approval Amount', downPayment: 'Down Payment',
      viewedProperties: 'Viewed Properties', otherBrokers: 'Other Brokers',
      fullName: 'Full Name', whatsapp: 'WhatsApp', email: 'Email',
      nationality: 'Nationality', basedInDubai: 'Based in Dubai',
      submit: 'Submit', submitting: 'Submitting…',
      purposeLabels: { investment: 'Investment', end_user: 'Personal Use' },
      goalLabels: { rental_yield: 'Rental Yield', capital: 'Capital Appreciation', both: 'Rental Yield + Capital Appreciation' },
      residenceLabels: { primary: 'Primary Residence', holiday: 'Holiday Home' },
      marketLabels: { offplan: 'Off-Plan (New Launch)', ready: 'Ready / Secondary', both: 'Open to Both' },
      paymentLabels: { cash: 'Cash Buyer', mortgage: 'Mortgage (Bank Financed)', payment_plan: 'Developer Payment Plan', unsure: 'Not Sure Yet' },
      timelineLabels: { immediate: 'Immediately (within 1 month)', '3months': 'Within 3 months', '6months': 'Within 6 months', '1year': 'Within 1 year', exploring: 'Just exploring' },
    },
  },

  ar: {
    back: 'رجوع',
    next: 'متابعة',
    yes: 'نعم', no: 'لا',
    step: (s, t) => `الخطوة ${s} من ${t}`,
    reviewStep: '✓ مراجعة وتأكيد',
    restart: '✕ إعادة البداية',

    welcome: {
      company: 'بنتا للعقارات',
      subtitle: 'مستشار عقارات دبي',
      heading: 'دعنا نجد عقارك المثالي',
      body: 'أجب على بعض الأسئلة وسيطابقك ذكاؤنا الاصطناعي مع أفضل العقارات في دبي. يستغرق حوالي 3 دقائق.',
      start: 'ابدأ',
      secure: 'آمن وخاص', time: '٣ دقائق', free: 'استشارة مجانية',
    },

    thankYou: {
      title: (name) => `شكراً، ${name}!`,
      body: 'طلبك الآن في قائمة الانتظار لدى ذكاؤنا الاصطناعي ليبحث ويجد أفضل العقارات المناسبة لك. سنشارك معك التقرير الكامل قريباً جداً.',
    },

    purpose: {
      title: 'ما هو غرض شرائك؟',
      subtitle: 'هذا يساعدنا في توصية النوع المناسب من العقارات لك.',
      investment: 'استثمار', investmentDesc: 'شراء لكسب دخل إيجاري أو نمو رأس المال',
      endUser: 'استخدام شخصي', endUserDesc: 'شراء للسكن في العقار بنفسك',
      goalLabel: 'ما هو هدفك الاستثماري؟',
      rentalYield: 'عائد الإيجار', rentalYieldDesc: 'دخل إيجاري شهري ثابت',
      capital: 'ارتفاع رأس المال', capitalDesc: 'اشتر الآن، بع بسعر أعلى لاحقاً',
      both: 'كلاهما', bothDesc: 'دخل إيجاري + نمو طويل الأمد',
      residenceLabel: 'ما نوع السكن؟',
      primary: 'المسكن الرئيسي', primaryDesc: 'منزلي الرئيسي في دبي',
      holiday: 'منزل للعطلات', holidayDesc: 'استخدام أحياناً، تأجير عند الغياب',
    },

    propertyType: {
      title: 'ما نوع العقار؟', subtitle: 'يمكنك اختيار أكثر من خيار.',
      apartment: 'شقة', apartmentDesc: 'وحدة في برج سكني',
      villa: 'فيلا', villaDesc: 'منزل مستقل مع حديقة',
      townhouse: 'تاون هاوس', townhouseDesc: 'منزل متعدد الطوابق',
      penthouse: 'بنتهاوس', penthouseDesc: 'وحدة فاخرة في الطابق الأخير',
    },

    bedrooms: {
      title: 'كم عدد غرف النوم؟', subtitle: 'اختر الحجم الأنسب لاحتياجاتك.',
    },

    areas: {
      title: 'المناطق المفضلة في دبي',
      subtitle: 'اختر جميع المجتمعات التي تهتم بها. يمكنك اختيار أكثر من واحدة.',
      selected: (n) => `تم اختيار ${n} ${n === 1 ? 'منطقة' : 'مناطق'}`,
    },

    market: {
      title: 'خارج الخطة أم السوق الجاهز؟', subtitle: 'هذا يحدد القوائم والمطورين الذين سنعرضهم لك.',
      offplan: 'خارج الخطة', offplanDesc: 'شراء مباشر من المطور. خطط دفع مرنة. سعر دخول أقل.',
      ready: 'جاهز / ثانوي', readyDesc: 'انتقل فوراً. مجتمعات راسخة. شفافية كاملة.',
      both: 'مفتوح للخيارين', bothDesc: 'أرني جميع الخيارات — أريد المقارنة والقرار.',
    },

    budget: {
      title: 'ما هي ميزانيتك؟', subtitle: 'حدد الحد الأدنى والأقصى لمساعدتنا في تصفية أفضل الخيارات.',
      rangeLabel: 'نطاق الميزانية المحدد', quickSelect: 'اختيار سريع:',
    },

    payment: {
      title: 'كيف ستموّل الشراء؟', subtitle: 'هذا يساعدنا في عرض خيارات الدفع الأنسب لك.',
      cash: 'مشترٍ نقدي', cashDesc: 'دفع كامل مقدماً',
      mortgage: 'قرض عقاري', mortgageDesc: 'شراء بتمويل بنكي',
      paymentPlan: 'خطة دفع المطور', paymentPlanDesc: 'خطة تقسيط خارج الخطة',
      unsure: 'لست متأكداً بعد', unsureDesc: 'أريد استكشاف خياراتي',
      employmentLabel: 'الحالة الوظيفية',
      employed: 'موظف', selfEmployed: 'عمل حر', businessOwner: 'صاحب عمل', investor: 'مستثمر / متقاعد',
      incomeLabel: 'الراتب / الدخل الشهري (درهم)', incomePlaceholder: 'مثلاً: 35,000',
      liabilitiesLabel: 'الالتزامات الشهرية (درهم) — قروض سيارات، بطاقات ائتمان، قروض أخرى',
      liabilitiesPlaceholder: 'مثلاً: 5,000 — أدخل 0 إذا لم تكن هناك التزامات',
      preapprovedLabel: 'هل حصلت على موافقة مسبقة للقرض؟',
      preapprovalAmountLabel: 'مبلغ الموافقة المسبقة (درهم)', preapprovalAmountPlaceholder: 'مثلاً: 2,500,000',
      downPaymentLabel: 'الدفعة المقدمة المتاحة',
    },

    features: {
      title: 'المميزات الأساسية', subtitle: 'اختر جميع المميزات المهمة لك.',
      pool: 'حمام سباحة', gym: 'صالة رياضية', parking: 'موقف مغطى',
      seaView: 'إطلالة بحرية', burjView: 'إطلالة برج خليفة', garden: 'حديقة / مساحة خارجية',
      maidsRoom: 'غرفة الخادمة', wardrobes: 'خزانة ملابس مدمجة', balcony: 'شرفة / تراس',
      petFriendly: 'صديق للحيوانات الأليفة', kidsPlay: 'منطقة ألعاب الأطفال', smartHome: 'منزل ذكي', security: 'أمن 24 ساعة',
      selected: (n) => `تم اختيار ${n} ${n === 1 ? 'ميزة' : 'مميزات'}`,
    },

    timeline: {
      title: 'متى تخطط للشراء؟', subtitle: 'هذا يساعدنا في تحديد أولويات الخيارات المناسبة لك.',
      immediate: '⚡ فوراً', immediateSub: 'خلال شهر واحد',
      threeMonths: '📅 خلال 3 أشهر', threeMonthsSub: 'مستعد للتحرك بسرعة',
      sixMonths: '🗓️ خلال 6 أشهر', sixMonthsSub: 'أخذ وقتي',
      oneYear: '📆 خلال سنة', oneYearSub: 'لا أزال أبحث',
      exploring: '🔍 مجرد استكشاف', exploringSub: 'لا جدول زمني محدد بعد',
      viewedLabel: 'هل شاهدت عقارات بالفعل؟',
      brokersLabel: 'هل تعمل مع وسطاء آخرين؟',
    },

    notes: {
      title: 'هل هناك أي شيء آخر يجب أن نعرفه؟',
      subtitle: 'أضف أي متطلبات محددة، تفضيلات، أو أسئلة لفريقنا.',
      placeholder: 'مثلاً: قريب من مدرسة محددة، قريب من المترو، طابق عالٍ، مطور محدد، استثمار للأبناء...',
      optional: 'اختياري — يمكنك تخطي هذه الخطوة',
      nextLabel: 'مراجعة إجاباتي',
    },

    contact: {
      title: 'تقريباً انتهينا — معلومات الاتصال',
      subtitle: 'سنستخدمها للتواصل معك وعرض أفضل العقارات.',
      nameLabel: 'الاسم الكامل', namePlaceholder: 'مثلاً: أحمد المنصوري',
      whatsappLabel: 'رقم واتساب', emailLabel: 'البريد الإلكتروني',
      nationalityLabel: 'الجنسية', nationalityPlaceholder: 'اختر جنسيتك',
      inDubaiLabel: 'هل أنت مقيم حالياً في دبي؟',
    },

    review: {
      heading: 'مراجعة إجاباتك',
      subheading: 'كل شيء يبدو جيداً؟ أرسل وسنتواصل معك قريباً.',
      edit: 'تعديل',
      purchasePurpose: 'غرض الشراء', propertyRequirements: 'متطلبات العقار',
      budget: 'الميزانية', paymentMethod: 'طريقة الدفع', mustHaveFeatures: 'المميزات الأساسية',
      timeline: 'الجدول الزمني', additionalNotes: 'ملاحظات إضافية', contactDetails: 'معلومات الاتصال',
      purpose: 'الغرض', investmentGoal: 'الهدف الاستثماري', residenceType: 'نوع السكن',
      propertyTypes: 'أنواع العقارات', bedrooms: 'غرف النوم', preferredAreas: 'المناطق المفضلة',
      market: 'السوق', budgetRange: 'نطاق الميزانية', payment: 'الدفع',
      employmentStatus: 'الحالة الوظيفية', monthlyIncome: 'الدخل الشهري',
      monthlyLiabilities: 'الالتزامات الشهرية', preapproved: 'موافقة مسبقة',
      preapprovalAmount: 'مبلغ الموافقة المسبقة', downPayment: 'الدفعة المقدمة',
      viewedProperties: 'العقارات المشاهدة', otherBrokers: 'وسطاء آخرون',
      fullName: 'الاسم الكامل', whatsapp: 'واتساب', email: 'البريد الإلكتروني',
      nationality: 'الجنسية', basedInDubai: 'مقيم في دبي',
      submit: 'إرسال', submitting: 'جاري الإرسال…',
      purposeLabels: { investment: 'استثمار', end_user: 'استخدام شخصي' },
      goalLabels: { rental_yield: 'عائد الإيجار', capital: 'ارتفاع رأس المال', both: 'عائد الإيجار + ارتفاع رأس المال' },
      residenceLabels: { primary: 'المسكن الرئيسي', holiday: 'منزل للعطلات' },
      marketLabels: { offplan: 'خارج الخطة', ready: 'جاهز / ثانوي', both: 'مفتوح للخيارين' },
      paymentLabels: { cash: 'مشترٍ نقدي', mortgage: 'قرض عقاري', payment_plan: 'خطة دفع المطور', unsure: 'لست متأكداً بعد' },
      timelineLabels: { immediate: 'فوراً (خلال شهر واحد)', '3months': 'خلال 3 أشهر', '6months': 'خلال 6 أشهر', '1year': 'خلال سنة', exploring: 'مجرد استكشاف' },
    },
  },
};
