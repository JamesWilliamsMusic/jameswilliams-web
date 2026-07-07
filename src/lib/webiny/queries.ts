export const GET_HERO = `
  query GetHero {
    listHeroContents(limit: 1) {
      data {
        id
        values {
          title
          tagline
          socialHandle
          backgroundImage
        }
      }
    }
  }
`;

export const GET_TOUR_DATES = `
  query GetTourDates {
    listTourDates(sort: createdOn_ASC, limit: 20) {
      data {
        id
        values {
          date
          city
          state
          venue
          status
          rsvpUrl
        }
      }
    }
  }
`;

export const GET_ALBUMS = `
  query GetAlbums {
    listAlbums(sort: id_DESC, limit: 10) {
      data {
        id
        values {
          title
          year
          coverImage
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
        values {
          title
          price
          image
          shopUrl
        }
      }
    }
  }
`;

export const GET_SITE_SETTINGS = `
  query GetSiteSettings {
    listSiteSettingsPlural(limit: 1) {
      data {
        id
        values {
          artistName
          copyright
          instagramUrl
          spotifyUrl
          appleMusicUrl
          youtubeUrl
          tiktokUrl
        }
      }
    }
  }
`;
