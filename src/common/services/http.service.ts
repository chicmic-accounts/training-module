import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class HttpService {
  http: any;
  constructor() {
    this.http = axios.create({
      baseURL: process.env.BASE_URL,
    });
  }

  async get(url) {
    try {
      const response = await this.http.get(url);
      return response.data;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  async post(url, data) {
    try {
      const response = await this.http.post(url, data);
      return response.data;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  async put(url, data) {
    try {
      const response = await this.http.put(url, data);
      return response.data;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  async delete(url) {
    try {
      const response = await this.http.delete(url);
      return response.data;
    } catch (error) {
      console.error(error);
      return error;
    }
  }
}
