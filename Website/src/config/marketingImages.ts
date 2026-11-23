/** Shared marketing photography for Training / Events / Insights / Contact / Care */

const pexels = (id: number, w = 1400, h = 1000) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop`

export const marketingImages = {
  trainingHero: pexels(3184292, 1800, 1000),
  trainingClassroom: pexels(3184360, 1200, 900),
  trainingLaptop: pexels(3184465, 1200, 900),
  trainingTeam: pexels(3184418, 1200, 900),
  trainingWorkshop: pexels(1181406, 1200, 900),

  eventsHero: pexels(2774556, 1800, 1000),
  eventsAudience: pexels(1181396, 1200, 900),
  eventsMeetup: pexels(1181622, 1200, 900),
  eventsConference: pexels(1181715, 1200, 900),
  eventsCommunity: pexels(3184339, 1200, 900),

  insightsHero: pexels(3183150, 1800, 1000),
  insightsDesk: pexels(590022, 1200, 900),
  insightsWrite: pexels(4050315, 1200, 900),
  insightsResearch: pexels(7659565, 1200, 900),
  insightsHealth: pexels(7579831, 1200, 900),
  insightsPrivacy: pexels(5380642, 1200, 900),
  insightsFamily: pexels(1128318, 1200, 900),

  contactHero: pexels(4226140, 1800, 1000),
  contactOffice: pexels(3184465, 1200, 900),
  contactSupport: pexels(7579832, 1200, 900),

  careHero: pexels(5452293, 1800, 1000),
  careHospital: pexels(236380, 1200, 900),
  careDoctor: pexels(5452201, 1200, 900),
} as const
