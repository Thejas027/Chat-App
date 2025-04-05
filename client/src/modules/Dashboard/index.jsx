import user from "../../assests/user.png";
import "./Dashboard.css"; // Import custom CSS for scrollbar styling

function DashBoard() {
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
          <div className="border-4 border-blue-500 rounded-full p-[2px]">
            <img src={user} alt="User" className="rounded-full w-20 h-20" />
          </div>
          <div className="ml-6">
            <h3 className="text-2xl font-bold text-gray-800">Tutorials Dev</h3>
            <p className="text-md font-medium text-gray-500">My Account</p>
          </div>
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
                className="flex items-center p-3 bg-white rounded-lg shadow-md hover:bg-blue-50 transition duration-200 cursor-pointer"
              >
                <img src={img} alt={name} className="w-12 h-12 rounded-full" />
                <div className="ml-4">
                  <h5 className="text-md font-semibold text-gray-800">
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
        <div className="w-[75%] bg-white h-16 mt-8 rounded-full flex items-center px-6 shadow-lg relative">
          <div className="flex-shrink-0">
            <img
              src={user}
              alt="User"
              className="w-12 h-12 rounded-full border-2 border-blue-500"
            />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800">Alex</h3>
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
              className="text-gray-500 hover:text-blue-500 transition duration-200 cursor-pointer"
            >
              <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2c-8.072 -.49 -14.51 -6.928 -15 -15a2 2 0 0 1 2 -2"></path>
              <path d="M15 5h6"></path>
              <path d="M18.5 7.5l2.5 -2.5l-2.5 -2.5"></path>
            </svg>
          </div>
        </div>
        <div className="h-[75%] border w-full overflow-y-scroll ">
          <div className="h-[1000px] px-10 py-14">
            <div className="p-4 w-[300px] bg-blue-20 0 rounded-b-xl border-tr-xl bg-blue-200 ">
              Hello, Hi this is thejas how are you guys
            </div>
            <div className="h-[80px] w-[300px] bg-blue-20 0 rounded-b-xl border-tl-xl bg-blue-400 ml-auto ">
                  Hii, this is abc nice to meet you 
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-[25%] h-screen bg-gray-50 shadow-lg"></div>
    </div>
  );
}

export default DashBoard;
