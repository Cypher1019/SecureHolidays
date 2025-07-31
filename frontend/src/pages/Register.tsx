import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import * as apiClient from "../api-client";
import { useAppContext } from "../contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import SecurePasswordInput from "../components/SecurePasswordInput";
import { useSession } from "../contexts/SessionContext";

export type RegisterFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const Register = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useAppContext();
  const { login } = useSession();

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const mutation = useMutation(apiClient.register, {
    onSuccess: async (data) => {
      showToast({ message: "Registration Success!", type: "SUCCESS" });
      
      // Login user with session data
      if (data.userId && data.token) {
        login(data.userId, data.sessionToken || '', data.token);
      }
      
      await queryClient.invalidateQueries("validateToken");
      navigate("/");
    },
    onError: (error: Error) => {
      showToast({ message: error.message, type: "ERROR" });
    },
  });

  const onSubmit = handleSubmit((data) => {
    // Validate password match
    if (password !== confirmPassword) {
      showToast({ message: "Passwords do not match", type: "ERROR" });
      return;
    }
    
    // Validate password complexity
    if (!isPasswordValid) {
      showToast({ message: "Please fix password validation errors", type: "ERROR" });
      return;
    }
    
    // Update form data with validated password
    const formData = {
      ...data,
      password: password
    };
    
    mutation.mutate(formData);
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <h2 className="text-3xl font-bold">Create an Account</h2>
      <div className="flex flex-col md:flex-row gap-5">
        <label className="text-gray-700 text-sm font-bold flex-1">
          First Name
          <input
            placeholder="Write your first name"
            className="border rounded w-full py-1 px-2 font-normal"
            {...register("firstName", { required: "This field is required" })}
          ></input>
          {errors.firstName && (
            <span className="text-red-500">{errors.firstName.message}</span>
          )}
        </label>
        <label className="text-gray-700 text-sm font-bold flex-1">
          Last Name
          <input
            placeholder="Write your last name"
            className="border rounded w-full py-1 px-2 font-normal"
            {...register("lastName", { required: "This field is required" })}
          ></input>
          {errors.lastName && (
            <span className="text-red-500">{errors.lastName.message}</span>
          )}
        </label>
      </div>
      <label className="text-gray-700 text-sm font-bold flex-1">
        Email
        <input
          type="email"
          placeholder="Write your email address"
          className="border rounded w-full py-1 px-2 font-normal"
          {...register("email", { required: "This field is required" })}
        ></input>
        {errors.email && (
          <span className="text-red-500">{errors.email.message}</span>
        )}
      </label>
      <label className="text-gray-700 text-sm font-bold flex-1">
        Password
        <SecurePasswordInput
          value={password}
          onChange={setPassword}
          onValidationChange={setIsPasswordValid}
          placeholder="Write your password"
          required={true}
          username={watch("email")} // Use email as username for validation
        />
      </label>
      <label className="text-gray-700 text-sm font-bold flex-1">
        Confirm Password
        <SecurePasswordInput
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Confirm your password"
          required={true}
          showStrengthIndicator={false}
        />
        {confirmPassword && password !== confirmPassword && (
          <span className="text-red-500 text-sm">Passwords do not match</span>
        )}
      </label>
      <span>
        <button
          type="submit"
          className="bg-blue-600 text-white p-2 font-bold hover:bg-blue-500 text-xl"
        >
          Create Account
        </button>
      </span>
    </form>
  );
};

export default Register;
