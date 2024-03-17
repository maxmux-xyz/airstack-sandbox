import { init, fetchQuery } from "@airstack/node";
import dotenv from 'dotenv';
dotenv.config();

const api_key = process.env.API_KEY!
init(api_key);

const query = `query MyQuery {
    SocialFollowings(
      input: {
        filter: {
          dappName: { _eq: farcaster }
          identity: {
            _in: [
              "fc_fname:dwr.eth"
            ]
          }
        }
        blockchain: ALL
        limit: 200
      }
    ) {
      Following {
        followingAddress {
          addresses
          socials(input: { filter: { dappName: { _eq: farcaster } } }) {
            profileName
            userId
            userAssociatedAddresses
          }
        }
        followingProfileId
      }
    }
  }`; // Replace with GraphQL Query

async function main() {
    const { data, error } = await fetchQuery(query);
    console.log("error:", error);

    // const following = data.SocialFollowings.Following[10]
    // console.log(following.followingAddress.socials[0].profileName)

    for (let i = 0; i < data.SocialFollowings.Following.length; i++) {
        const following = data.SocialFollowings.Following[i];
        console.log(following.followingAddress.socials[0].profileName)
    }

}

main()