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
    listAlbums(sort: id_DESC, limit: 20) {
      data {
        id
        values {
          title
          year
          coverImage
          embedUrl
        }
      }
    }
  }
`;

export const GET_NEW_RELEASES = `
  query GetNewReleases {
    listNewReleases(sort: id_DESC, limit: 5) {
      data {
        id
        values {
          title
          releaseDate
          coverImage
          embedUrl
          type
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
          favicon
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

export const GET_EXCLUSIVE_POSTS = `
  query GetExclusivePosts($limit: Int!, $offset: Int!) {
    listExclusivePosts(
      where: { isExclusive: true }
      sort: publishedAt_DESC
      limit: $limit
      offset: $offset
    ) {
      data {
        id
        values {
          title
          slug
          body
          excerpt
          coverImage
          publishedAt
          category
          isExclusive
        }
      }
      meta {
        totalCount
        hasMoreItems
      }
    }
  }
`;

export const GET_EXCLUSIVE_POST_BY_SLUG = `
  query GetExclusivePostBySlug($slug: String!) {
    listExclusivePosts(
      where: { slug: $slug, isExclusive: true }
      limit: 1
    ) {
      data {
        id
        values {
          title
          slug
          body
          excerpt
          coverImage
          publishedAt
          category
          isExclusive
        }
      }
    }
  }
`;

export const GET_ABOUT = `
  query GetAbout {
    listAboutContents(limit: 1) {
      data {
        id
        values {
          heading
          body
          image
        }
      }
    }
  }
`;
