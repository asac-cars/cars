DROP TABLE IF EXISTS cars;
create table cars (
    id SERIAL primary key not null,
    vin VARCHAR(255),
    year VARCHAR(255),
    make VARCHAR(255),
    model VARCHAR(255),
    engine VARCHAR(255),
    style VARCHAR(255),
    madeIn VARCHAR(255),
    fuelCapacity VARCHAR(255),
    fuelInternal VARCHAR(255),
    fuelExternal VARCHAR(255),
    transmission VARCHAR(255),
    seats VARCHAR(255),
    price VARCHAR(255),
    alloy_wheels VARCHAR(255),
    automatic_headlights VARCHAR(255),
    cd_player VARCHAR(255),
    child_safety_door_locks VARCHAR(255),
    fogLights VARCHAR(255),
    cruise_control VARCHAR(255),
    driverAirbag VARCHAR(255),
    passenger_airbag VARCHAR(255),
    cooled_seat VARCHAR(255),
    heated_seat VARCHAR(255),
    parkingAid VARCHAR(255),
    genuine_wood_trim VARCHAR(255),
    heated_exterior_mirror VARCHAR(255),
    heated_steering_wheel VARCHAR (255),
    keyless_entry VARCHAR(255),
    leather_seat VARCHAR(255),
    navigation_aid VARCHAR(255),
    power_windows VARCHAR(255)

);

DROP TABLE IF EXISTS obd;
create table obd (

    id SERIAL primary key not null,

    code VARCHAR(255),

    diagnosis VARCHAR(255),

    date VARCHAR(255)


)