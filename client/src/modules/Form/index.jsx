import { useState } from "react";
import Button from "../../components/Button";
import Input from "../../components/Input";

const Form = ({ isSignPage = false }) => {
  const [data, setData] = useState({
    ...(isSignPage ? {} : { fullName: "" }),
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", data);
    // Add further form submission logic here
  };
  console.log(data);
  return (
    <div className=" h-screen flex justify-center items-center">
      <div className="bg-white w-[400px] h-auto shadow-2xl rounded-2xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            {isSignPage ? "Welcome Back" : "Join Us"}
          </h1>
          <p className="text-gray-600 text-sm mt-2">
            {isSignPage
              ? "Sign in to get explored"
              : "Join us and start connecting with your friends today!"}
          </p>
        </div>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {!isSignPage && (
            <Input
              label="Full Name"
              name="fullName"
              placeholder="Enter your full name"
              value={data.fullName}
              onChange={handleChange}
              isRequired
            />
          )}
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={data.email}
            onChange={handleChange}
            isRequired
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={data.password}
            onChange={handleChange}
            isRequired
          />
          <Button
            label={isSignPage ? "Sign In" : "Sign Up"}
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-3"
          />
        </form>
        <div className="text-center mt-6 text-gray-600">
          {isSignPage ? (
            <>
              Don't have an account?{" "}
              <span className="text-purple-600 font-semibold cursor-pointer hover:underline">
                Sign Up
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span className="text-purple-600 font-semibold cursor-pointer hover:underline">
                Sign In
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Form;
