// The base token path
const TOKEN_PATH = "modules/caeora-maps-tokens-assets/assets/tokens/Monster_Manual_Tokens/";

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
	
	// Assign the current saved value if there is one
        replaceArtwork = game.settings.get("caeora-maps-tokens-assets", "replaceArtwork") ?? false;

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
function replaceActorArtwork(actor, data, options, userId) {
	if ( !replaceArtwork || (actor.type !== "npc") || !hasProperty(actor, "data.data.details.cr") ) return;
	const cleanName = actor.name.replace(/ /g, "");
	const crDir = String(getProperty(actor, "data.data.details.cr")).replace(".", "-");
	const tokenSrc = `${TOKEN_PATH}cr${crDir}/with-shadows/${cleanName}.webp`;
	if ( !availableTokens.has(tokenSrc) ) return;
	actor.data.update({"img": tokenSrc, "data.token": actor.token || {}, "token.img": tokenSrc})
}

// Initialize module
Hooks.on("init", initialize);
