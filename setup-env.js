const fs = require("fs");
const readline = require("readline");

const ENV_PATH = "./apps/api/.env";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const envFields = [
  {
    key: "MONGODB_URI",
    question:
      "MongoDB URI (mongodb+srv://username:password@cluster.mongodb.net/dbname): ",
    required: true,
  },
  {
    key: "PORT",
    question: "Port [4000]: ",
    defaultValue: "4000",
    required: true,
  },
  {
    key: "FRONTEND_URL",
    question: "Frontend URL [http://localhost:5173]: ",
    defaultValue: "http://localhost:5173",
    required: true,
  },
  {
    key: "JWT_SECRET",
    question: "JWT Secret: ",
    required: true,
  },
  {
    key: "JWT_REFRESH_SECRET",
    question: "JWT Refresh Secret: ",
    required: true,
  },
  {
    key: "GITHUB_CLIENT_ID",
    question: "GitHub Client ID: ",
    required: true,
  },
  {
    key: "GITHUB_CLIENT_SECRET",
    question: "GitHub Client Secret: ",
    required: true,
  },
  {
    key: "GITHUB_CALLBACK_URL",
    question:
      "GitHub Callback URL [http://localhost:4000/auth/github/callback]: ",
    defaultValue: "http://localhost:4000/auth/github/callback",
    required: true,
  },
  {
    key: "GITHUB_APP_ID",
    question: "GitHub App ID: ",
    required: true,
  },
  {
    key: "GITHUB_PRIVATE_KEY",
    question: "GitHub Private Key: ",
    required: false,
  },
  {
    key: "GITHUB_WEBHOOK_SECRET",
    question: "GitHub Webhook Secret: ",
    required: true,
  },
  {
    key: "REDIS_URL",
    question: "Redis URL [redis://localhost:6379]: ",
    defaultValue: "redis://localhost:6379",
    required: true,
  },
];

// Read existing .env values
const existingEnv = {};

if (fs.existsSync(ENV_PATH)) {
  const content = fs.readFileSync(ENV_PATH, "utf8");

  content.split("\n").forEach((line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) return;

    const [key, ...valueParts] = trimmedLine.split("=");

    if (key) {
      existingEnv[key.trim()] = valueParts
        .join("=")
        .replace(/^"|"$/g, "")
        .trim();
    }
  });
}

// Find missing fields
const missingFields = envFields.filter((field) => {
  const value = existingEnv[field.key];

  return field.required && (!value || value.trim() === "");
});

if (missingFields.length === 0) {
  console.log("✅ All required environment variables are configured.");
  process.exit(0);
}

console.log("\n🚀 Innoworks Environment Setup\n");
console.log("Missing environment variables detected:\n");

const updatedEnv = { ...existingEnv };

function ask(index) {
  if (index === missingFields.length) {
    fs.mkdirSync("./apps/api", { recursive: true });

    const envContent = envFields
      .map((field) => {
        const value = updatedEnv[field.key] ?? field.defaultValue ?? "";

        return `${field.key}="${value}"`;
      })
      .join("\n");

    fs.writeFileSync(ENV_PATH, envContent);

    console.log(`\n✅ Environment file updated successfully at ${ENV_PATH}`);

    rl.close();
    return;
  }

  const field = missingFields[index];

  rl.question(field.question, (answer) => {
    const value = answer.trim() || field.defaultValue || "";

    updatedEnv[field.key] = value;

    ask(index + 1);
  });
}

ask(0);
