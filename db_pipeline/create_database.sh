node --max-old-space-size=4000 1-db_creator.js
node --max-old-space-size=4000 2-cty_creator.js
node --max-old-space-size=4000 3-pop_creator.js 1
node --max-old-space-size=4000 3-pop_creator.js 2
node --max-old-space-size=4000 3-pop_creator.js 3
node --max-old-space-size=4000 3-pop_creator.js 4
node --max-old-space-size=4000 3-pop_creator.js 5
node --max-old-space-size=4000 4-auction_creator.js
node --max-old-space-size=4000 5-match_auctions.js


# FIXME: Populaton Creator script needs to be run 2x 
node --max-old-space-size=4000 3-pop_creator.js 1
node --max-old-space-size=4000 3-pop_creator.js 2
node --max-old-space-size=4000 3-pop_creator.js 3
node --max-old-space-size=4000 3-pop_creator.js 4
node --max-old-space-size=4000 3-pop_creator.js 5


node --max-old-space-size=4000 6-band_creator.js

# node --max-old-space-size=4000 CSV_creator.js
