/** Function to send an Check-In Embed to all servers/channels
 * that have a user-server-relation with the given user_id
 */

import { Embed, EmbedBuilder } from "discord.js";
import { getUserByTraewellingId } from "../../../database/user";
import { StopOver, Trip } from "hafas-client";
import StaticMaps from "staticmaps";
import dayjs from "dayjs";

async function createRouteImage(status: TW_Status): Promise<Buffer | null> {
  try {
    const res = await fetch(
      "https://v6.db.transport.rest/trips/" +
        status.train.hafasId +
        "?stopovers=true"
    ).then((res) => res.json());

    const trip = res.trip as Trip;

    if (!trip) {
      throw new Error("No trip found");
    }

    const stops = trip.stopovers as StopOver[];

    // find stop where user started the trip by name and planned departure
    const start = stops.find(
      (stop: StopOver) =>
        stop.stop?.name === status.train.origin.name &&
        dayjs(stop.plannedDeparture).format("YYYY-MM-DDTHH:mm:ss") ===
          dayjs(status.train.origin.departurePlanned).format(
            "YYYY-MM-DDTHH:mm:ss"
          )
    );

    console.log("Start found: ", start?.stop?.name);

    // find stop where user ended the trip by name and planned arrival

    const end = stops.find(
      (stop: StopOver) =>
        stop.stop?.name === status.train.destination.name &&
        dayjs(stop.plannedArrival).format("YYYY-MM-DDTHH:mm:ss") ===
          dayjs(status.train.destination.arrivalPlanned).format(
            "YYYY-MM-DDTHH:mm:ss"
          )
    );

    console.log("End found: ", end?.stop?.name);

    if (!start || !end) {
      throw new Error("Start or end stop not found");
    }

    // get the index of the start and end stop
    const startIndex = stops.indexOf(start);
    const endIndex = stops.indexOf(end);

    // get the stops between the start and end stop
    const route = stops.slice(startIndex, endIndex + 1);

    let brouterQuery = "";
    for (const stop of route) {
      brouterQuery += `${stop.stop?.location?.longitude},${stop.stop?.location?.latitude}|`;
    }

    // remove the last pipe
    brouterQuery = brouterQuery.slice(0, -1);

    // Get Route
    const routeData = await fetch(
      "https://brouter.de/brouter?profile=rail&alternativeidx=0&format=geojson&lonlats=" +
        brouterQuery
    ).then((res) => res.json());

    if (routeData.features.length === 0) {
      throw new Error("No route found");
    }

    const geoData = routeData.features[0].geometry.coordinates;

    const map = new StaticMaps({
      width: 600,
      height: 400,
    });

    map.addPolygon({
      coords: geoData,
      color: "#c72730BB",
      width: 5,
    });

    const imageBuffer = await map.image.buffer("image/png");

    return imageBuffer;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function createCheckInEmbed(status: TW_Status): Promise<{
  embed: EmbedBuilder;
  imageBuffer: Buffer | null;
}> {
  // get user from database
  const user = await getUserByTraewellingId(status.user);
  if (!user) {
    throw new Error("User not found in the database");
  }

  const imageBuffer = await createRouteImage(status);

  const departureDelay = dayjs(status.train.origin.departureReal).diff(
    dayjs(status.train.origin.departurePlanned),
    "minute"
  );
  const arrivalDelay = dayjs(status.train.destination.arrivalReal).diff(
    dayjs(status.train.destination.arrivalPlanned),
    "minute"
  );

  const embed = new EmbedBuilder()
    .setTitle(
      `${status.train.origin.name} ➔ ${status.train.destination.name} | ${status.train.lineName}`
    )
    .setAuthor({
      name: user.display_name,
      iconURL: status.profilePicture,
      url: `https://traewelling.de/@${status.username}`,
    })
    .setFooter({
      text: `Status #${status.id}`,
      iconURL: "https://traewelling.de/images/icons/touch-icon-ipad-retina.png",
    })
    .setTimestamp(dayjs(status.createdAt).toDate())
    .setColor("#c72730")
    .addFields([
      {
        name: "Distance",
        value: `${(status.train.distance / 1000).toLocaleString()} km`,
        inline: true,
      },
      {
        name: "Departure",
        value:
          dayjs(status.train.origin.departurePlanned).format(
            "DD.MM.YYYY HH:mm"
          ) + (departureDelay > 0 ? ` (+${departureDelay} min)` : ""),
        inline: true,
      },
      {
        name: "Arrival",
        value:
          dayjs(status.train.destination.arrivalPlanned).format(
            "DD.MM.YYYY HH:mm"
          ) + (arrivalDelay > 0 ? ` (+${arrivalDelay} min)` : ""),
        inline: true,
      },
      {
        name: "Duration",
        value: `${status.train.duration} min`,
        inline: true,
      },
      {
        name: "Points",
        value: `${status.train.points}`,
        inline: true,
      },
    ]);

  if (status.body.length > 0) {
    embed.setDescription(status.body);
  }

  if (imageBuffer) {
    embed.setImage("attachment://route.png");
  }

  return { embed, imageBuffer };
}
