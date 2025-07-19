const { createClient } = require("@supabase/supabase-js");

// Try multiple env file locations
require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  console.error(
    "Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
  console.error(
    "Available env vars:",
    Object.keys(process.env).filter((key) => key.includes("SUPABASE"))
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log("Using Supabase URL:", supabaseUrl);
console.log(
  "Using Service Role Key:",
  supabaseServiceKey ? "***" + supabaseServiceKey.slice(-4) : "NOT FOUND"
);

// Simple password hashing function (same as in authService.ts)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function setupClubAuth() {
  try {
    console.log("Setting up club authentication...");

    // First, check if the club_auth table exists
    const { data: tableExists, error: tableError } = await supabase
      .from("club_auth")
      .select("id")
      .limit(1);

    if (tableError && tableError.code === "42P01") {
      console.log(
        "club_auth table does not exist. Please run the migration first."
      );
      console.log("Run: npx supabase db push");
      return;
    }

    // Check if we already have club auth data
    const { data: existingAuth, error: existingError } = await supabase
      .from("club_auth")
      .select("*");

    if (existingError) {
      console.error("Error checking existing auth:", existingError);
      return;
    }

    if (existingAuth && existingAuth.length > 0) {
      console.log("Club authentication data already exists:");
      existingAuth.forEach((auth) => {
        console.log(`- Club ID: ${auth.club_id}, Email: ${auth.email}`);
      });
      return;
    }

    // Get existing clubs
    const { data: clubs, error: clubsError } = await supabase
      .from("Clubs")
      .select('id, "Name"');

    if (clubsError) {
      console.error("Error fetching clubs:", clubsError);
      return;
    }

    if (!clubs || clubs.length === 0) {
      console.log("No clubs found. Please create clubs first.");
      return;
    }

    console.log(
      "Found clubs:",
      clubs.map((c) => c.Name)
    );

    // Create auth records for each club
    for (const club of clubs) {
      const email = `${club.Name.toLowerCase().replace(
        /\s+/g,
        ""
      )}@example.com`;
      const password = "SecurePass123!"; // Default password
      const passwordHash = await hashPassword(password);

      const { error: insertError } = await supabase.from("club_auth").insert({
        club_id: club.id,
        email: email,
        password_hash: passwordHash,
      });

      if (insertError) {
        console.error(`Error creating auth for ${club.Name}:`, insertError);
      } else {
        console.log(`✅ Created auth for ${club.Name}:`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   Club ID: ${club.id}`);
      }
    }

    console.log("\n🎉 Club authentication setup complete!");
    console.log("\nDefault credentials for each club:");
    console.log("- Email: [clubname]@example.com");
    console.log("- Password: SecurePass123!");
    console.log("\n⚠️  IMPORTANT: Change these passwords after first login!");
  } catch (error) {
    console.error("Setup error:", error);
  }
}

setupClubAuth();
