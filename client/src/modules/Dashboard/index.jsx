import user from "../../assests/user.png";
import "./Dashboard.css"; // Import custom CSS for scrollbar styling
import Input from "../../components/Input/index";
import { useAuth } from "../../context/AuthContext";

function DashBoard() {
  const { user: currentUser, logout } = useAuth();
  
  const handleLogout = () => {
    logout();
  };
  const contacts = [
    {
      name: "John",
      status: "Available",
      img: user,
    },
    {
      name: "Charlie",
      status: "Available",
      img: user,
    },
    {
      name: "Dom",
      status: "Available",
      img: user,
    },
    {
      name: "Carry",
      status: "Available",
      img: user,
    },
    {
      name: "Alex",
      status: "Available",
      img: user,
    },
    {
      name: "Mary",
      status: "Available",
      img: user,
    },
  ];

  return (
    <div className="w-screen flex bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-[25%] h-screen bg-gray-50 shadow-lg">
        <div className="flex justify-center items-center my-8">
          <div className="border-4 border-blue-500 rounded-full p-[2px] hover:scale-105 transition-transform duration-300">
            <img src={currentUser?.avatar || user} alt="User" className="rounded-full w-20 h-20" />
          </div>
          <div className="ml-6 flex-1">
            <h3 className="text-2xl font-bold text-gray-800 hover:text-blue-500 transition-colors duration-300">
              {currentUser?.fullName || 'Loading...'}
            </h3>
            <p className="text-md font-medium text-gray-500">My Account</p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-4 p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors duration-300"
            title="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
        <hr className="border-gray-300" />
        <div className="mt-6 px-4">
          <h4 className="text-lg font-semibold text-gray-700 mb-4">Messages</h4>
          <div
            className="space-y-4 overflow-y-auto custom-scrollbar"
            style={{ maxHeight: "calc(100vh - 220px)" }}
          >
            {contacts.map(({ name, status, img }, index) => (
              <div
                key={index}
                className="flex items-center p-3 bg-white rounded-lg shadow-md hover:bg-blue-50 hover:shadow-lg transition duration-300 cursor-pointer"
              >
                <img
                  src={img}
                  alt={name}
                  className="w-12 h-12 rounded-full border-2 border-gray-300 hover:border-blue-500 transition-colors duration-300"
                />
                <div className="ml-4">
                  <h5 className="text-md font-semibold text-gray-800 hover:text-blue-500 transition-colors duration-300">
                    {name}
                  </h5>
                  <p className="text-sm text-gray-500">{status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-[50%] h-screen bg-gray-100 shadow-lg flex flex-col items-center">
        <div className="w-[75%] bg-white h-16 mt-8 rounded-full flex items-center px-6 shadow-lg relative hover:shadow-xl transition-shadow duration-300">
          <div className="flex-shrink-0">
            <img
              src={user}
              alt="User"
              className="w-12 h-12 rounded-full border-2 border-blue-500 shadow-md hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-500 transition-colors duration-300">
              Alex
            </h3>
            <p className="text-sm text-green-500">Online</p>
          </div>
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              width="24"
              height="24"
              stroke-width="2"
              className="text-gray-500 hover:text-blue-500 transition duration-300 cursor-pointer"
            >
              <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2c-8.072 -.49 -14.51 -6.928 -15 -15a2 2 0 0 1 2 -2"></path>
              <path d="M15 5h6"></path>
              <path d="M18.5 7.5l2.5 -2.5l-2.5 -2.5"></path>
            </svg>
          </div>
        </div>
        <div className="h-full w-full overflow-y-scroll px-6 py-8 space-y-6 custom-scrollbar">
          <div className="p-4 max-w-[60%] bg-blue-100 rounded-tl-lg rounded-br-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <p className="text-gray-800 text-sm">
              Hello, Hi this is Thejas. How are you guys doing today?
            </p>
          </div>
          <div className="p-4 max-w-[60%] bg-blue-500 text-white rounded-tr-lg rounded-bl-lg shadow-md ml-auto hover:shadow-lg transition-shadow duration-300">
            <p className="text-sm">
              Hi, this is Alex. I'm doing great! How about you?
            </p>
          </div>
          <div className="p-4 max-w-[60%] bg-blue-100 rounded-tl-lg rounded-br-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <p className="text-gray-800 text-sm">
              I'm good too! Just working on some projects.
            </p>
          </div>
          <div className="p-4 max-w-[60%] bg-blue-500 text-white rounded-tr-lg rounded-bl-lg shadow-md ml-auto hover:shadow-lg transition-shadow duration-300">
            <p className="text-sm">
              That's awesome! Let me know if you need any help.
            </p>
          </div>
          <div className="p-4 max-w-[60%] bg-blue-100 rounded-tl-lg rounded-br-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <p className="text-gray-800 text-sm">
              Sure, I’ll reach out if I get stuck. What about you? Any plans for
              the weekend?
            </p>
          </div>
          <div className="p-4 max-w-[60%] bg-blue-500 text-white rounded-tr-lg rounded-bl-lg shadow-md ml-auto hover:shadow-lg transition-shadow duration-300">
            <p className="text-sm">
              Not much, just planning to relax and maybe catch up on some
              reading.
            </p>
          </div>
          <div className="p-4 max-w-[60%] bg-blue-100 rounded-tl-lg rounded-br-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <p className="text-gray-800 text-sm">
              That sounds great! Any book recommendations?
            </p>
          </div>
          <div className="p-4 max-w-[60%] bg-blue-500 text-white rounded-tr-lg rounded-bl-lg shadow-md ml-auto hover:shadow-lg transition-shadow duration-300">
            <p className="text-sm">
              Yeah, I just started reading "Atomic Habits" by James Clear. It's
              really insightful!
            </p>
          </div>
          <div className="p-4 max-w-[60%] bg-blue-100 rounded-tl-lg rounded-br-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <p className="text-gray-800 text-sm">
              Oh, I’ve heard about that one! I’ll definitely check it out.
              Thanks for the suggestion!
            </p>
          </div>
        </div>
        <div className="w-full bg-gray-50 flex items-center px-4 py-3 border-t border-gray-300">
          <Input
            name="message"
            value={""} // Bind the value to a state variable
            onChange={() => {}} // Update the state on change
            className="flex-1 mx-4 bg-gray-200 text-gray-800 rounded-full px-6 py-3 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg hover:shadow-lg transition-shadow duration-300"
            placeholder="Type a message..."
          />
          <button className="p-2 ml-2 bg-blue-500 rounded-full shadow-md hover:bg-blue-600 hover:scale-105 transition-transform duration-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-white"
            >
              <path d="M22 2L11 13"></path>
              <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
            </svg>
          </button>
          <button className="p-2 ml-2 bg-green-500 rounded-full shadow-md hover:bg-green-600 hover:scale-105 transition-transform duration-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-white"
            >
              <path d="M12 5v14"></path>
              <path d="M5 12h14"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Right Sidebar */}

      <div className="w-[25%] h-screen bg-gray-50 shadow-lg"></div>
    </div>
  );
}

export default DashBoard;
