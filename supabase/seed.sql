SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict PQ7iiSUgIdor7dr3EUafQJ0GiDHatyaKxHgOdgWuYirsROLygnqTzbb0xdmnU1D

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: positions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."positions" ("id", "x", "y", "zoomX", "zoomY", "mobileZoomP1X", "mobileZoomP1Y", "mobileZoomP2X", "mobileZoomP2Y", "slots", "label") VALUES
	(1, 23, 35, 15, 48, 20, 20, 35, 20, '{"1a": {"p": 1, "x": 20, "y": 35}, "1b": {"p": 1, "x": 28, "y": 50}, "1c": {"p": 1, "x": 20, "y": 65}, "1d": {"p": 2, "x": 40, "y": 35}, "1e": {"p": 2, "x": 48, "y": 50}, "1f": {"p": 2, "x": 40, "y": 65}}', 'telnitz'),
	(2, 56, 43, 60, 50, 48, 20, 64, 20, '{"2a": {"p": 1, "x": 40, "y": 35}, "2b": {"p": 1, "x": 48, "y": 50}, "2c": {"p": 1, "x": 40, "y": 65}, "2d": {"p": 2, "x": 60, "y": 35}, "2e": {"p": 2, "x": 68, "y": 50}, "2f": {"p": 2, "x": 60, "y": 65}}', 'pratzen'),
	(3, 85, 35, 98, 30, 90, 10, 100, 10, '{"3a": {"p": 1, "x": 70, "y": 25}, "3b": {"p": 1, "x": 75, "y": 40}, "3c": {"p": 1, "x": 78, "y": 58}, "3d": {"p": 2, "x": 85, "y": 25}, "3e": {"p": 2, "x": 90, "y": 40}, "3f": {"p": 2, "x": 92, "y": 58}}', 'santon');


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: positions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."positions_id_seq"', 1, false);


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."sessions_id_seq"', 519, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict PQ7iiSUgIdor7dr3EUafQJ0GiDHatyaKxHgOdgWuYirsROLygnqTzbb0xdmnU1D

RESET ALL;
