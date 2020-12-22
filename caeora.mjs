// The base token path
const TOKEN_PATH = "modules/caeora-maps-tokens-assets/assets/tokens/";

// A cached list of available tokens
let availableTokens = new Set();

// Store a reference to whether artwork is being replaced
let replaceArtwork = false;

/**
 * Initialize the Caeora module on Foundry VTT init
 */
function initialize() {

	// Only support the dnd5e system for this functionality
	if ( game.system.id !== "dnd5e" ) return;

	// Register token replacement setting
	game.settings.register("caeora-maps-tokens-assets", "replaceArtwork", {
		name: "Auto-Replace Actor Artwork",
		hint: "Automatically replace the portrait and token artwork for a NPC Actor when that actor is imported into the game world.",
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
		onChange: replace => replaceArtwork = replace
	});

	// Handle actor replacement, if the setting is enabled
	Hooks.on("preCreateActor", replaceActorArtwork);

	// Cache available tokens
	cacheAvailableTokens();
}

/**
 * Cache the set of available tokens which can be used to replace artwork to avoid repeated filesystem requests
 */
async function cacheAvailableTokens() {
	availableTokens.clear();
	const crs = await FilePicker.browse("data", TOKEN_PATH);
	for ( let cr of crs.dirs ) {
		const tokens = await FilePicker.browse("data", cr+"/with-shadows/");
		tokens.files.forEach(t => availableTokens.add(t));
	}
}

/**
 * Replace the artwork for a NPC actor with the version from this module
 */
function replaceActorArtwork(data, options, userId) {
	if ( !replaceArtwork || (data.type !== "npc") || !hasProperty(data, "data.details.cr") ) return;
	const cleanName = data.name.replace(/ /g, "");
	const crDir = String(getProperty(data, "data.details.cr")).replace(".", "-");
	const tokenSrc = `${TOKEN_PATH}cr${crDir}/with-shadows/${cleanName}.png`;
	if ( !availableTokens.has(tokenSrc) ) return;
	data.img = tokenSrc;
	data.token = data.token || {};
	data.token.img = tokenSrc;
}

// Initialize module
Hooks.on("init", initialize);
