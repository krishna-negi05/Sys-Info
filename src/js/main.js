document.addEventListener("DOMContentLoaded", function () {
  const terminal = document.getElementById("terminal");

  // Command Registry
  const commands = {
    help: displayHelp,
    sysinfo: displaySysInfo,
    battery: displayBatteryInfo,
    network: displayNetworkInfo,
    weather: fetchWeatherInfo,
    dns: fetchDNSInfo,
    clear: clearTerminal,
  };

  // Create a new command element with input field
  const createCommandElement = () => {
    const commandInput = document.createElement("div");
    commandInput.innerHTML = `
      <div class="flex text-sm md:text-base gap-2 my-2">
        <span class="text-red-500">sysinfo:~<span class="text-green-500">$</span></span>
        <input type="text" class="bg-transparent text-slate-50 outline-none border-none w-full" autocomplete="off" aria-label="command" />
      </div>`;
    terminal.appendChild(commandInput);

    // Focus on the input field
    const inputField = commandInput.querySelector("input");
    inputField.focus();
    inputField.addEventListener("keydown", handleCommand);
  };

  // Command handler
  async function handleCommand(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      const inputField = event.target;
      const userInput = inputField.value.trim();
      const [command, ...args] = userInput.split(" ");

      // Display user input as plain text
      const userCommand = document.createElement("div");
      userCommand.className = "text-slate-50 text-sm md:text-base";
      userCommand.textContent = userInput;
      inputField.parentElement.replaceWith(userCommand);

      // Create output element
      const outputElement = document.createElement("div");
      outputElement.className = "text-slate-50 text-sm md:text-base whitespace-pre-wrap";
      terminal.appendChild(outputElement);

      // Execute command
      const executeCommand = commands[command.toLowerCase()];
      if (executeCommand) {
        try {
          await executeCommand(outputElement, args);
        } catch (error) {
          outputElement.textContent = `❌ Error: ${error.message}`;
        }
      } else {
        outputElement.textContent = "❌ Unknown command. Type 'help' for assistance.";
      }

      // Add new input field
      createCommandElement();
    }
  }

  // Display Help
  function displayHelp(output) {
    output.textContent = `
Available Commands:
- help: Displays this help message
- sysinfo: Shows system information
- battery: Displays battery details
- network: Shows network stats
- weather <location>: Fetches weather for the specified location
- dns <domain>: Displays DNS records for the domain
- clear: Clears the terminal
    `;
  }

  // System Info
  function displaySysInfo(output) {
    const userAgent = navigator.userAgent;
    output.textContent = `
=#= System Information =#=
Browser: ${navigator.userAgentData?.brands?.map((b) => b.brand).join(", ") || "Unknown"}
Platform: ${navigator.userAgentData?.platform || navigator.platform}
User Agent: ${userAgent}
    `;
  }

  // Battery Info
  async function displayBatteryInfo(output) {
    if (navigator.getBattery) {
      const battery = await navigator.getBattery();
      output.textContent = `
=#= Battery Stats =#=
Level: ${Math.round(battery.level * 100)}% ${battery.charging ? "⚡ Charging" : "🔋 Not Charging"}
Charging Time: ${battery.chargingTime || "N/A"} seconds
Discharging Time: ${battery.dischargingTime || "N/A"} seconds
      `;
    } else {
      output.textContent = "Battery information not supported on this browser.";
    }
  }

  // Network Info
  function displayNetworkInfo(output) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      output.textContent = `
=#= Network Stats =#=
Type: ${connection.effectiveType || "Unknown"}
Downlink: ${connection.downlink || "N/A"} Mbps
RTT: ${connection.rtt || "N/A"} ms
Data Saver: ${connection.saveData ? "Enabled" : "Disabled"}
      `;
    } else {
      output.textContent = "Network information not available.";
    }
  }

  // Weather Info
  async function fetchWeatherInfo(output, args) {
    const location = args.join(" ");
    if (!location) {
      output.textContent = "❌ Please specify a location.";
      return;
    }

    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=YOUR_API_KEY`);
      const data = await response.json();
      if (data.cod !== 200) throw new Error(data.message);

      output.textContent = `
=#= Weather (${data.name}) =#=
Temperature: ${(data.main.temp - 273.15).toFixed(2)}°C
Condition: ${data.weather[0].main}
Humidity: ${data.main.humidity}%
Wind Speed: ${data.wind.speed} m/s
      `;
    } catch (error) {
      output.textContent = `❌ Couldn't fetch weather information: ${error.message}`;
    }
  }

  // DNS Info
  async function fetchDNSInfo(output, args) {
    const domain = args[0];
    if (!domain) {
      output.textContent = "❌ Please specify a domain.";
      return;
    }

    try {
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
      const data = await response.json();
      if (!data.Answer) throw new Error("No DNS records found.");

      output.textContent = `
=#= DNS Records (${domain}) =#=
${data.Answer.map((record) => `Type: ${record.type}, TTL: ${record.TTL}, Data: ${record.data}`).join("\n")}
      `;
    } catch (error) {
      output.textContent = `❌ Error fetching DNS info: ${error.message}`;
    }
  }

  // Clear Terminal
  function clearTerminal() {
    terminal.innerHTML = "";
  }

  // Initialize
  createCommandElement();
});
