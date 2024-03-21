import { init, fetchQuery } from "@airstack/node";
import dotenv from 'dotenv';
dotenv.config();

const api_key = process.env.API_KEY!
init(api_key);

interface AirstackQueryVariables {
  fcUsername: string
  limit?: number
  cursor?: string
}
type AirstackQuery = (vars: AirstackQueryVariables, limit: number, cursor: string) => string

function followingQuery(vars: AirstackQueryVariables) {
  const c = vars.cursor !== '' ? `cursor: "${vars.cursor}"` : ''
  return `query MyQuery {
    SocialFollowings(
      input: {
        filter: {
          dappName: { _eq: farcaster }
          identity: {
            _in: [
              "fc_fname:${vars.fcUsername}"
            ]
          }
        }
        blockchain: ALL
        limit: ${vars.limit}
        ${c}
      }
    ) {
      Following {
        followingAddress {
          socials(input: { filter: { dappName: { _eq: farcaster } } }) {
            profileName
          }
        }
      }
      pageInfo {
        hasNextPage # Booelan indicating if the next page of data exist
        nextCursor # cursor to next page (2nd page)
      }
    }
  }`
}

function followerQuery(vars: AirstackQueryVariables) {
  const c = vars.cursor !== '' ? `cursor: "${vars.cursor}"` : ''
  return `query MyQuery {
    SocialFollowers(
      input: {
        filter: {
          dappName: { _eq: farcaster }
          identity: {
            _in: [
              "fc_fname:${vars.fcUsername}"
            ]
          }
        }
        blockchain: ALL
        limit: ${vars.limit}
        ${c}
      }
    ) {
      Follower {
        followerAddress {
          socials(input: { filter: { dappName: { _eq: farcaster } } }) {
            profileName
          }
        }
      }
      pageInfo {
        hasNextPage # Booelan indicating if the next page of data exist
        nextCursor # cursor to next page (2nd page)
      }
    }
  }`
}

export type FollowingReturnType = {
  SocialFollowings: {
    Following: {
      followingAddress: {
        socials: {
          profileName: string
        }[]
      }
    }[]
    pageInfo: {
      hasNextPage: boolean
      nextCursor: string
    }
  }
}

export type FollowerReturnType = {
  SocialFollowers: {
    Follower: {
      followerAddress: {
        socials: {
          profileName: string
        }[]
      }
    }[]
    pageInfo: {
      hasNextPage: boolean
      nextCursor: string
    }
  }
}

function countFollowerFollowingQuery(
  vars: AirstackQueryVariables,
  limit: number = 200,
  cursor: string = ''
) {
  return `query MyQuery {
    Socials(
      input: {filter: {dappName: {_eq: farcaster}, identity: {_eq: "fc_fname:${vars.fcUsername}"}}, blockchain: ethereum}
    ) {
      Social {
        followerCount
        followingCount
      }
    }
  }`
}

export type FollowerFollowingCount = {
  Socials: {
    Social: {
      followerCount: number
      followingCount: number
    }[]
  }
}

async function fetchAirstack(
  getQueryFunc: AirstackQuery,
  vars: AirstackQueryVariables,
  nextCursor: string = ''
) {
  const r = await fetchQuery(getQueryFunc(vars, 200, nextCursor))
  const data = r.data
  const error = r.error
  if (error) {
    throw new Error('Error fetching following')
  }
  return data
}

export type FcFollowerFollowingCount = {
  followerCount: number
  followingCount: number
}

async function countFollowerFollowing(
  getQueryFunc: AirstackQuery,
  vars: AirstackQueryVariables
): Promise<FcFollowerFollowingCount> {
  const data = (await fetchAirstack(getQueryFunc, vars, '')) as FollowerFollowingCount

  return {
    followerCount: data.Socials.Social[0]!.followerCount,
    followingCount: data.Socials.Social[0]!.followingCount,
  }
}

export type UsernamesReturnType = {
  usernames: string[]
  nextCursor: string
  hasNextPage: boolean
}

async function getFollowing(
  getQueryFunc: AirstackQuery,
  vars: AirstackQueryVariables
): Promise<UsernamesReturnType> {
  const data = (await fetchAirstack(getQueryFunc, vars)) as FollowingReturnType
  const usernames = []
  for (const f of data.SocialFollowings.Following) {
    usernames.push(f.followingAddress.socials[0]!.profileName)
  }
  return {
    usernames: usernames,
    nextCursor: data.SocialFollowings.pageInfo.nextCursor,
    hasNextPage: data.SocialFollowings.pageInfo.hasNextPage,
  }
}

async function getFollowers(
  getQueryFunc: AirstackQuery,
  vars: AirstackQueryVariables
): Promise<UsernamesReturnType> {
  const data = (await fetchAirstack(getQueryFunc, vars)) as FollowerReturnType
  const usernames = []
  for (const f of data.SocialFollowers.Follower) {
    usernames.push(f.followerAddress.socials[0]!.profileName)
  }
  return {
    usernames: usernames,
    nextCursor: data.SocialFollowers.pageInfo.nextCursor,
    hasNextPage: data.SocialFollowers.pageInfo.hasNextPage,
  }
}

export async function following(
  fcUsername: string,
  limit: number = 200,
  cursor: string = ''
): Promise<UsernamesReturnType> {
  // Get FC usernames following a user (fcUsername)
  // init(process.env.AIRSTACK_API_KEY!)

  const vars = {
    fcUsername: fcUsername,
    limit: limit,
    cursor: cursor,
  } as AirstackQueryVariables

  return getFollowing(followingQuery, vars)
}

export async function followers(
  fcUsername: string,
  limit: number = 200,
  cursor: string = ''
): Promise<UsernamesReturnType> {
  // Get FC usernames that are followers of a user (fcUsername)
  // init(process.env.AIRSTACK_API_KEY!)

  const vars = {
    fcUsername: fcUsername,
    limit: limit,
    cursor: cursor,
  } as AirstackQueryVariables

  return getFollowers(followerQuery, vars)
}

export async function followerFollowingCount(
  fcUsername: string
): Promise<FcFollowerFollowingCount> {
  // Get FC follower and following count for a user
  // init(process.env.AIRSTACK_API_KEY!)

  const vars = { fcUsername } as AirstackQueryVariables
  return countFollowerFollowing(countFollowerFollowingQuery, vars)
}

async function main() {
  const data = await followerFollowingCount('maxmux')
  console.log(data)
}

main()
