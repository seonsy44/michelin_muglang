import { RestaurantModel } from "../schemas/restaurant.mjs";

class Restaurant {
  static async create({
    name,
    address,
    location,
    minPrice,
    maxPrice,
    currency,
    cuisine,
    longitude,
    latitude,
    phoneNumber,
    url,
    websiteUrl,
    award,
    country,
  }) {
    const createdNewRestaurant = await RestaurantModel.create({
      name,
      address,
      location,
      minPrice,
      maxPrice,
      currency,
      cuisine,
      longitude,
      latitude,
      phoneNumber,
      url,
      websiteUrl,
      award,
      country,
    });
    return createdNewRestaurant;
  }

  static async findByName({ name }) {
    const restaurant = await RestaurantModel.findOne({ name }).lean();
    return restaurant;
  }

  static async findById({ id }) {
    const restaurant = await RestaurantModel.findOne({ _id: id }).lean();
    return restaurant;
  }

  static async findAllByCountry({ country }) {
    const restaurants = await RestaurantModel.find({ country }).lean();
    return restaurants;
  }

  static async findAll() {
    const restaurants = await RestaurantModel.find({})
      .update(
        { bookmarkCount: { $exists: false } },
        { $set: { bookmarkCount: 0 } },
      )
      .lean();
    return restaurants;
  }

  static async countByCountry(country) {
    const ret = await RestaurantModel.countDocuments({ country });
    return ret;
  }

  static async findAllByCountryPaging({ page, pageSize, country }) {
    const len = await RestaurantModel.countDocuments({ country });
    const lastPage = Math.ceil(len / pageSize);
    const offset = (page - 1) * pageSize + 1;

    const restaurants = await RestaurantModel.find({ country })
      .sort({ _id: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    return { restaurants, lastPage, len, offset };
  }

  static async findAllPaging({ page, pageSize }) {
    const len = await RestaurantModel.countDocuments({});
    const lastPage = Math.ceil(len / pageSize);
    const offset = (page - 1) * pageSize + 1;

    const restaurants = await RestaurantModel.find({})
      .sort({ _id: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    return { restaurants, lastPage, len, offset };
  }

  static async findAllByCuisinePaging({ page, pageSize, cuisine }) {
    const len = await RestaurantModel.countDocuments({ cuisine });
    const lastPage = Math.ceil(len / pageSize);
    const offset = (page - 1) * pageSize + 1;

    const restaurants = await RestaurantModel.find({
      cuisine,
    })
      .sort({ _id: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    return { restaurants, lastPage, len, offset };
  }

  static async findAllByQuery({
    page,
    pageSize,
    name = "",
    address = "",
    location = "",
    minPrice = 0,
    maxPrice = Number.MAX_SAFE_INTEGER,
    cuisine = "",
    award = "",
    country = "",
  }) {
    const len = await RestaurantModel.countDocuments({
      name: { $regex: name, $options: "i" },
      address: { $regex: address, $options: "i" },
      location: { $regex: location, $options: "i" },
      minPrice: { $gte: parseInt(minPrice) },
      maxPrice: { $lte: parseInt(maxPrice) },
      cuisine: { $regex: cuisine, $options: "i" },
      award: { $regex: award, $options: "i" },
      country: { $regex: country, $options: "i" },
    });

    const lastPage = Math.ceil(len / pageSize);
    const offset = (page - 1) * pageSize + 1;

    const restaurants = await RestaurantModel.find({
      name: { $regex: name, $options: "i" },
      address: { $regex: address, $options: "i" },
      location: { $regex: location, $options: "i" },
      minPrice: { $gte: parseInt(minPrice) },
      maxPrice: { $lte: parseInt(maxPrice) },
      cuisine: { $regex: cuisine, $options: "i" },
      award: { $regex: award, $options: "i" },
      country: { $regex: country, $options: "i" },
    })
      .sort({ _id: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    return { restaurants, lastPage, len, offset };
  }

  static async findRestaurantsNearById({ id }) {
    const targetRestaurant = await RestaurantModel.findOne({ _id: id });

    const restaurantsNear = await RestaurantModel.aggregate([
      {
        $geoNear: {
          spherical: true,
          near: {
            type: "Point",
            coordinates: [
              parseFloat(targetRestaurant.longitude),
              parseFloat(targetRestaurant.latitude),
            ],
          },
          query: { country: targetRestaurant.country },
          maxDistance: 30000, // 최대 거리를 30km로 제한(개수 제한 방법..임시)
          distanceField: "distance", // 미터(m) 단위로 표현,
          distanceMultiplier: 0.001, // m => km로 변환
        },
      },
    ]);

    return restaurantsNear;
  }

  static async bookmark({ id, session }) {
    const filter = { _id: id };
    const update = { $inc: { bookmarkCount: 1 } }; // 음식점의 북마크 개수 +1
    const option = { returnOriginal: false };

    const bookmark = await RestaurantModel.findOneAndUpdate(
      filter,
      update,
      option,
    ).session(session);

    return bookmark;
  }

  static async unbookmark({ id, session }) {
    const filter = { _id: id };
    const update = { $inc: { bookmarkCount: -1 } }; // 음식점의 북마크 개수 -1
    const option = { returnOriginal: false };

    const bookmark = await RestaurantModel.findOneAndUpdate(
      filter,
      update,
      option,
    ).session(session);
    return bookmark;
  }

  static async unbookmarkByList({ bookmarkList, session }) {
    const filter = { _id: { $in: bookmarkList } };
    const update = { $inc: { bookmarkCount: -1 } }; // 유저 탈퇴시, 유저가 북마크한 음식점의 북마크 개수 -1
    const option = { returnOriginal: false };

    await RestaurantModel.updateMany(filter, update, option).session(session);

    return { status: "ok" };
  }
}

export { Restaurant };
