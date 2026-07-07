export const GET_HERO = `
  query GetHero {
    listHeroContents(limit: 1) {
      data {
        id
        title
        tagline
        socialHandle
        backgroundImage
      }
    }
  }
`;

export const GET_TOUR_DATES = `
  query GetTourDates {
    listTourDates(sort: date_ASC, limit: 20) {
      data {
        id
        date
        city
        state
        venue
        status
        rsvpUrl
      }
    }
  }
`;

export const GET_ALBUMS = `
  query GetAlbums {
    listAlbums(sort: year_DESC, limit: 10) {
      data {
        id
        title
        year
        trackCount
        totalDuration
        coverImage
        tracks {
          title
          duration
        }
      }
    }
  }
`;

export const GET_MERCH = `
  query GetMerch {
    listMerchItems(limit: 20) {
      data {
        id
        title
        price
        image
        shopUrl
      }
    }
  }
`;

export const GET_SITE_SETTINGS = `
  query GetSiteSettings {
    listSiteSettings(limit: 1) {
      data {
        id
        artistName
        copyright
        socialLinks {
          platform
          url
        }
      }
    }
  }
`;
